const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const warnModel = require("../../database/models/moderation.js");
const Logging = require("../../database/schemas/logging.js");
const discord = require("discord.js");
const send = require("../../packages/logs/index.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "removewarn",
      aliases: ["rw", "removewarns"],
      description: "Remove a certain users warn",
      category: "Moderation",
      usage: "<user> [ID]",
      examples: ["rw @peter iasdjas"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    let client = message.client;

    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    const mentionedMember =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!mentionedMember) {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.banUserValid}`)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });
    }

    let reason = args.slice(2).join(" ");
    if (!reason) reason = language.softbanNoReason;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    const warnDoc = await warnModel
      .findOne({
        guildID: message.guild.id,
        memberID: mentionedMember.id,
      })
      .catch((err) => console.log(err));

    if (!warnDoc || !warnDoc.warnings.length) {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.rmNoWarning}`)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });
    }

    let warningID = args[1];
    if (!warningID)
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.rmWarnInvalid} `)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });

    let check = warnDoc.warningID.filter((word) => args[1] === word);

    if (!warnDoc.warningID.includes(warningID))
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.rmWarnInvalid} `)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });

    if (!check)
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.rmWarnInvalid} `)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });

    if (check.length < 0) {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setAuthor({
              name: `${message.author.tag}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`${client.emoji.fail} | ${language.rmWarnInvalid} `)
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });
    }
    let toReset = warnDoc.warningID.length;

    //warnDoc.memberID.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1)
    //warnDoc.guildID.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1)
    warnDoc.warnings.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
    warnDoc.warningID.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
    warnDoc.modType.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
    warnDoc.moderator.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
    warnDoc.date.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);

    await warnDoc.save().catch((err) => console.log(err));

    const removeEmbed = new discord.MessageEmbed()
      .setDescription(
        `${
          message.client.emoji.success
        } | Cleared Warn **#${warningID}** from **${
          mentionedMember.user.tag
        }** ${
          logging && logging.moderation.include_reason === "true"
            ? `\n\n**Reason:** ${reason}`
            : ``
        }`
      )
      .setColor(message.client.color.green);

    message.channel
      .sendCustom(removeEmbed)
      .then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      })
      .catch(() => {});

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
              if (logging.moderation.warns == "true") {
                let color = logging.moderation.color;
                if (color == "#000000") color = message.client.color.green;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                const logEmbed = new MessageEmbed()
                  .setAuthor({
                    name: `Action: \`Remove Warn\` | ${mentionedMember.user.tag} | Case #${logcase}`,
                    iconURL: mentionedMember.user.displayAvatarURL({
                      format: "png",
                    }),
                  })
                  .addFields(
                    { name: "User", value: `${mentionedMember}`, inline: true },
                    {
                      name: "Moderator",
                      value: `${message.member}`,
                      inline: true,
                    },
                    { name: "Reason", value: `${reason}`, inline: true }
                  )
                  .setFooter({
                    text: `ID: ${mentionedMember.id} | Warn ID: ${warningID}`,
                  })
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
