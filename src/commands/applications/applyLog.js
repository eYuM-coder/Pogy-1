const discord = require("discord.js");
const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const app = require("../../database/models/application/application.js");
const MessageEmbed = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "applylog",
      aliases: ["applychannel", "applylogs"],
      usage: "enable #channel | disable",
      category: "Applications",
      examples: ["apply"],
      description: "Set's the guild's apply Logs",
      cooldown: 5,
      userPermission: ["MANAGE_GUILD"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    if (args.length < 1) {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setColor(message.guild.members.me.displayHexColor)
            .setDescription(
              `${message.client.emoji.fail} | ${language.applylogerrorchannel}`
            ),
        ],
      });
    }

    if (args.includes("disable")) {
      await app.findOne(
        {
          guildID: message.guild.id,
        },
        async (err, guild) => {
          guild
            .updateOne({
              appLogs: null,
            })
            .catch((err) => console.error(err));

          return message.channel.sendCustom({
            embeds: [
              new discord.MessageEmbed()
                .setColor(message.guild.members.me.displayHexColor)
                .setDescription(
                  `${message.client.emoji.fail} | ${language.applylogdisabled}`
                ),
            ],
          });
        }
      );
      return;
    }

    const channel = await message.mentions.channels.first();

    if (!channel)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.guild.members.me.displayHexColor)
            .setDescription(
              `${message.client.emoji.fail} | ${language.applylogvalidchannel}`
            ),
        ],
      });

    await app.findOne(
      {
        guildID: message.guild.id,
      },
      async (err, guild) => {
        guild
          .updateOne({
            appLogs: channel.id,
          })
          .catch((err) => console.error(err));

        return message.channel.sendCustom({
          embeds: [
            new discord.MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(
                `${message.client.emoji.success} | ${language.applylogSuccess} ${channel}`
              ),
          ],
        });
      }
    );
  }
};
