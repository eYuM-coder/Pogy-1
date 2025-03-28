const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "softban",
      aliases: ["sb", "sban"],
      description: "Softban the specified user from the guild",
      category: "Moderation",
      usage: "<user> [reason]",
      examples: ["softban @Peter Breaking the rules"],
      guildOnly: true,
      botPermission: ["BAN_MEMBERS"],
      userPermission: ["BAN_MEMBERS"],
    });
  }

  async run(message, args) {
    let client = message.client;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    const member =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!member)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(`${client.emoji.fail} | ${language.softbanNoUser}`)
            .setColor(client.color.red),
        ],
      });

    if (member === message.member)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(
              `${client.emoji.fail} | ${language.softbanSelfUser}`
            )
            .setColor(client.color.red),
        ],
      });

    if (!member.bannable)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(
              `${client.emoji.fail} | ${language.softbanNotBannable}`
            )
            .setColor(client.color.red),
        ],
      });

    let reason = args.slice(1).join(" ");
    if (!reason) reason = language.softbanNoReason;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    await member.ban({
      reason: `${reason} / ${language.softbanResponsible}: ${message.author.tag}`,
      days: 7,
    });
    await message.guild.members.unban(
      member.user,
      `${reason} / ${language.softbanResponsible}: ${message.author.tag}`
    );

    const embed = new MessageEmbed()

      .setDescription(
        `${client.emoji.success} | ${language.softbanSuccess} **${
          member.user.tag
        }** ${
          logging && logging.moderation.include_reason === "true"
            ? `\n\n**Reason:** ${reason}`
            : ``
        }`
      )
      .setColor(client.color.green);

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

    // Update mod log
    if (logging) {
      if (logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }

      const role = message.guild.roles.cache.get(
        logging.moderation.ignore_role
      );
      const channel = message.guild.channels.cache.get(
        logging.moderation.channel
      );

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
              if (logging.moderation.ban == "true") {
                let color = logging.moderation.color;
                if (color == "#000000") color = message.client.color.green;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                let reason = args.slice(1).join(" ");
                if (!reason) reason = `${language.noReasonProvided}`;
                if (reason.length > 1024)
                  reason = reason.slice(0, 1021) + "...";

                const logEmbed = new MessageEmbed()
                  .setAuthor({
                    name: `Action: \`Soft Ban\` | ${member.user.tag} | Case #${logcase}`,
                    iconURL: member.user.displayAvatarURL({ format: "png" }),
                  })
                  .addFields(
                    { name: "User", value: `${member}`, inline: true },
                    {
                      name: "Moderator",
                      value: `${message.member}`,
                      inline: true,
                    },
                    { name: "Reason", value: `${reason}`, inline: true }
                  )
                  .setFooter({ text: `ID: ${member.id}` })
                  .setTimestamp()
                  .setColor(color);

                send(channel, {
                  username: `${this.client.user.username}`,
                  embeds: [logEmbed],
                }).catch((e) => {
                  console.log(e);
                });

                logging.moderation.caseN = logcase + 1;
                await logging.save().catch(() => {});
              }
            }
          }
        }
      }
    }
  }
};
