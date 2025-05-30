const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const warnModel = require("../../database/models/moderation.js");
const discord = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "resetwarn",
      aliases: ["clearwarn", "resetwarns", "clearwarns", "cw"],
      description: "Clear all the users warns",
      category: "Moderation",
      usage: "<user> [reason]",
      examples: ["resetwarns @Peter Warnings have been reset"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    let client = message.client;

    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);
    const logging = await Logging.findOne({ guildId: message.guild.id });

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

    let reason = args.slice(1).join(" ");
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
    await warnDoc.updateOne({
      modType: [],
      warnings: [],
      warningID: [],
      moderator: [],
      date: [],
    });

    const removeEmbed = new discord.MessageEmbed()
      .setDescription(
        `${message.client.emoji.success} | Cleared **${
          mentionedMember.user.tag
        }**'s warnings. ${
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
                if (color == "#000000") color = message.client.color.yellow;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                const logEmbed = new MessageEmbed()
                  .setAuthor({
                    name: `Action: \`Clear Warn\` | ${mentionedMember.user.tag} | Case #${logcase}`,
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
                  .setFooter({ text: `ID: ${mentionedMember.id}` })
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
