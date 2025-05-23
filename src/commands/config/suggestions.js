const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "suggestion",
      description: "Enable or disable and approve or decline suggestions",
      category: "Config",
      usage: [
        "<enable #channel | disable> / suggestion approve/decline <message ID>",
      ],
      examples: [
        "suggestion enable #suggestions",
        "suggestion disable",
        "suggestion approve/decline 793797217239",
      ],
      cooldown: 3,
      userPermission: ["MANAGE_MESSAGES"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    let prefix = guildDB.prefix;
    let fail = message.client.emoji.fail;
    let properUsage = new MessageEmbed()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(
        `${language.suggesting7.replace(/{prefix}/g, `${prefix}`)}`
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` });

    if (args.length < 1) {
      return message.channel.sendCustom(properUsage);
    }

    if (args.includes("disable")) {
      if (guildDB.suggestion.suggestionChannelID === null)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(
                `${message.client.emoji.fail} ${language.suggesting8}`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        });
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          guild.suggestion.suggestionChannelID = null;
          await guild.save().catch(() => {});

          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.guild.members.me.displayHexColor)
                .setDescription(
                  `${message.client.emoji.success} ${language.suggesting9}`
                )
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
          });
        }
      );
      return;
    } else if (args.includes("enable")) {
      const channel = await message.mentions.channels.first();

      if (!channel) return message.channel.sendCustom(properUsage);
      if (guildDB.suggestion.suggestionChannelID === channel.id)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(`${fail} ${channel} ${language.suggesting10}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        });
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          guild.suggestion.suggestionChannelID = channel.id;
          await guild.save().catch(() => {});

          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.guild.members.me.displayHexColor)
                .setDescription(
                  `${message.client.emoji.success} ${language.suggesting11} ${channel}`
                ),
            ],
          });
        }
      );
    } else if (args.includes("approve") || args.includes("accept")) {
      if (guildDB.suggestion.decline == "false") {
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(
                `${fail} Staff can't approve or decline Suggestions in this guild.`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });
      }
      if (
        !guildDB.suggestion.suggestionChannelID ||
        !guildDB.suggestion.suggestionChannelID === null
      )
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting1}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      let suggestion = guildDB.suggestion.suggestionChannelID;
      let channel = message.guild.channels.cache.get(suggestion);
      if (!channel)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting2}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (!args[1])
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting12}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      try {
        var suggestionMsg = await channel.messages.fetch(args[1]);
      } catch (e) {
        message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting13}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });
        return;
      }

      let description = suggestionMsg.embeds[0].description;

      if (suggestionMsg.embeds[0].title !== `${language.suggesting3}`) {
        if (suggestionMsg.embeds[0].title === `${language.suggesting14}`) {
          message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ format: "png" })
                })
                .setDescription(`${fail} ${language.suggesting15}`)
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                .setTimestamp()
                .setColor("RED"),
            ],
          });
        } else {
          message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ format: "png" })
                })
                .setDescription(`${fail} ${language.suggesting16}`)
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                .setTimestamp()
                .setColor("RED"),
            ],
          });
        }

        return;
      }
      var acceptReason = args.splice(2).join(" ");
      if (!acceptReason) acceptReason = `${language.noReasonProvided}`;
      if (args.join(" ").length > 600)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting17}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      const editedEmbed = new MessageEmbed()
        .setColor("#2bff80")
        .setTitle(`${language.suggesting14}`)
        .setDescription(
          `${description}\n\n**${language.suggesting18}**\n__**${language.reason}**__ ${acceptReason}\n__**${language.suggesting19}**__ ${message.author}`
        );
      suggestionMsg.edit({ embeds: [editedEmbed] });
      suggestionMsg.reactions.removeAll();
      message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(
                `${message.client.emoji.success} ${language.suggesting20} ${channel}\n\n__**${language.reason}**__ ${acceptReason}`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("GREEN"),
          ],
        })
        .then((k) => {
          message.delete().catch(() => {});
          setTimeout(() => {
            k.delete().catch(() => {});
          }, 10000);
        });
    } else if (args.includes("decline")) {
      if (guildDB.suggestion.decline == "false") {
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(
                `${fail} Staff can't approve or decline Suggestions in this guild.`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });
      }
      if (
        !guildDB.suggestion.suggestionChannelID ||
        !guildDB.suggestion.suggestionChannelID === null
      )
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting1}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      let suggestion = guildDB.suggestion.suggestionChannelID;
      let channel = message.guild.channels.cache.get(suggestion);
      if (!channel)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting2}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (!args[1])
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail}  ${language.suggesting12}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      try {
        suggestionMsg = await channel.messages.fetch(args[1]);
      } catch (e) {
        message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting13}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });
        return;
      }

      if (suggestionMsg.embeds[0].title !== `${language.suggesting3}`) {
        if (suggestionMsg.embeds[0].title === `${language.suggesting14}`) {
          message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ format: "png" })
                })
                .setDescription(`${fail} ${language.suggesting15}`)
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                .setTimestamp()
                .setColor("RED"),
            ],
          });
        } else {
          message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ format: "png" })
                })
                .setDescription(`${fail} ${language.suggesting16}`)
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                .setTimestamp()
                .setColor("RED"),
            ],
          });
        }

        return;
      }
      acceptReason = args.splice(2).join(" ");
      if (!acceptReason) acceptReason = `${language.noReasonProvided}`;

      if (args.join(" ").length > 600)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(`${fail} ${language.suggesting17}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      suggestionMsg.reactions.removeAll();
      message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" })
              })
              .setDescription(
                `${message.client.emoji.success} ${language.suggesting24} ${channel}\n\n__**${language.reason}**__ ${acceptReason}`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("GREEN"),
          ],
        })
        .then((k) => {
          message.delete().catch(() => {});
          setTimeout(() => {
            k.delete().catch(() => {});
          }, 10000);
        });
    } else if (args[0]) {
      message.channel.sendCustom(properUsage);
    } else {
      message.channel.sendCustom(properUsage);
    }
  }
};
