const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "slowmode",
      aliases: ["sm"],
      description: "Enables slowmode in a channel with the specified rate",
      category: "Moderation",
      usage: "slowmode [channel mention/ID] <rate> [reason]",
      examples: ["slowmode #general 10"],
      guildOnly: true,
      botPermission: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_CHANNELS"],
      userPermission: ["MANAGE_CHANNELS"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const fail = client.emoji.fail;
    const success = client.emoji.success;

    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    let index = 1;
    let channel =
      getChannelFromMention(message, args[0]) ||
      message.guild.channels.cache.get(args[0]);
    if (!channel) {
      channel = message.channel;
      index--;
    }

    if (channel.type != "GUILD_TEXT" || !channel.viewable)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Slow Mode Error`)
            .setDescription(`I can't view the provided channel`)
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });

    const rate = args[index];
    if (!rate || rate < 0 || rate > 59)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Slow Mode Error`)
            .setDescription(
              ` Please provide a rate limit between 0 and 59 seconds`
            )
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });

    const number = parseInt(rate);
    if (isNaN(number)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Slow Mode Error`)
            .setDescription(
              ` Please provide a rate limit between 0 and 59 seconds`
            )
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });
    }

    if (!channel.permissionsFor(message.guild.members.me).has(["MANAGE_CHANNELS"]))
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} Slow Mode Error`)
            .setDescription(
              ` Please make sure I have the **Manage Channels** Permission`
            )
            .setTimestamp()
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(message.guild.members.me.displayHexColor),
        ],
      });

    let reason = args.slice(index + 1).join(" ");
    if (!reason) reason = "No Reason was Provided";
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    await channel.setRateLimitPerUser(rate, reason); // set channel rate

    if (rate === "0") {
      message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${success} Slow Mode was successfuly disabled${
                  logging && logging.moderation.include_reason === "true"
                    ? `\n\n**Reason:** ${reason}`
                    : ``
                }`
              )
              .setColor(message.guild.members.me.displayHexColor),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
    } else {
      message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${success} | Slow Mode was successfuly enabled to **1 msg /${rate}s** ${
                  logging && logging.moderation.include_reason === "true"
                    ? `\n\n**Reason:** ${reason}`
                    : ``
                }`
              )
              .setColor(message.guild.members.me.displayHexColor),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
    }

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

      if (logging.moderation.slowmode == "true") {
        if (channel) {
          if (message.channel.id !== logging.moderation.ignore_channel) {
            if (
              !role ||
              (role &&
                !message.member.roles.cache.find(
                  (r) => r.name.toLowerCase() === role.name
                ))
            ) {
              if (logging.moderation.kick == "true") {
                let color = logging.moderation.color;
                if (color == "#000000") color = message.client.color.yellow;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                let reason = args.slice(1).join(" ");
                if (!reason) reason = `${language.noReasonProvided}`;
                if (reason.length > 1024)
                  reason = reason.slice(0, 1021) + "...";

                const logEmbed = new MessageEmbed()
                  .setAuthor({
                    name: `Action: \`Slow Mode\` | ${message.author.tag} | Case #${logcase}`,
                    iconURL: message.author.displayAvatarURL({ format: "png" }),
                  })
                  .addFields(
                    { name: "User", value: `${message.member}`, inline: true },
                    { name: "Reason", value: `${reason}`, inline: true }
                  )
                  .setFooter({ text: `ID: ${message.author.id}` })
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

function getChannelFromMention(message, mention) {
  if (!mention) return;
  const matches = mention.match(/^<#(\d+)>$/);
  if (!matches) return;
  const id = matches[1];
  return message.guild.channels.cache.get(id);
}
