const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "addrole",
      aliases: ["addr"],
      description: "Adds the specified role to the mentioned user",
      category: "Moderation",
      usage: "<user>",
      examples: ["addrole @peter"],
      guildOnly: true,
      botPermission: ["MANAGE_ROLES"],
      userPermission: ["MANAGE_ROLES"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const fail = client.emoji.fail;
    const success = client.emoji.success;
    const logging = await Logging.findOne({ guildId: message.guild.id });

    let member =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!member)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Invalid User`)
            .setDescription(`Please Mention a Valid user mention / user ID`)
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });

    const role =
      getRoleFromMention(message, args[1]) ||
      message.guild.roles.cache.get(args[1]) ||
      message.guild.roles.cache.find(
        (rl) => rl.name.toLowerCase() === args.slice(1).join(" ").toLowerCase()
      );

    let reason = `The current Feature doesnt need a reason`;
    if (!reason) reason = `No Reason Provided`;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    if (!role)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Invalid Role`)
            .setDescription(`Please Provide a Valid Role / Role ID`)
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });
    else if (member.roles.cache.has(role.id))
      // If member already has role
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Role Error`)
            .setDescription(`The user already has that role.`)
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });
    else {
      try {
        await member.roles.add(role, [
          `Role Add / Responsible User: ${message.author.tag}`,
        ]);
        const embed = new MessageEmbed()

          .setDescription(
            `${success} | Added** ${role.name}** to **${member.user.tag}**`
          )
          .setColor(message.guild.members.me.displayHexColor);
        message.channel
          .sendCustom({ embeds: [embed] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});

        if (logging) {
          const role = message.guild.roles.cache.get(
            logging.moderation.ignore_role
          );
          const channel = message.guild.channels.cache.get(
            logging.moderation.channel
          );

          if (logging.moderation.delete_after_executed === "true") {
            message.delete().catch(() => {});
          }

          if (logging.moderation.toggle == "true") {
            if (channel) {
              if (message.channel.id !== logging.moderation.ignore_channel) {
                if (
                  !role ||
                  (role &&
                    !message.member.roles.cache.find(
                      (r) => r.name.toLowerCase() === role.name
                    ))
                ) {
                  if (logging.moderation.role == "true") {
                    let color = logging.moderation.color;
                    if (color == "#000000") color = message.client.color.green;

                    let logcase = logging.moderation.caseN;
                    if (!logcase) logcase = `1`;

                    const logEmbed = new MessageEmbed()
                      .setAuthor({
                        name: `Action: \`Add Role\` | ${member.user.tag} | Case #${logcase}`,
                        iconURL: member.user.displayAvatarURL({
                          format: "png",
                        }),
                      })
                      .addFields(
                        { name: "User", value: `${member}`, inline: true },
                        {
                          name: "Moderator",
                          value: `${message.member}`,
                          inline: true,
                        }
                      )
                      .setFooter({ text: `ID: ${member.id}` })
                      .setTimestamp()
                      .setColor(color);

                    channel.send({ embeds: [logEmbed] }).catch(() => {});

                    logging.moderation.caseN = logcase + 1;
                    await logging.save().catch(() => {});
                  }
                }
              }
            }
          }
        }
      } catch {
        return message.channel.sendCustom(
          `Seems like my role is below, please rearrange the roles!`
        );
      }
    }
  }
};

function getRoleFromMention(message, mention) {
  if (!mention) return;
  const matches = mention.match(/^<@&(\d+)>$/);
  if (!matches) return;
  const id = matches[1];
  return message.guild.roles.cache.get(id);
}
