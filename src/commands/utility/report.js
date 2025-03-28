const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "report",
      description: "Enable server reports!",
      category: "Utility",
      usage: ["<enable #channel | disable> / report @user / ID <reason>"],
      examples: [
        "report enable #sserver-reports",
        "report disable",
        "report 232327382392 IP logging",
      ],
      cooldown: 3,
      botPermission: ["ADD_REACTIONS"],
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    let prefix = guildDB.prefix;
    let fail = message.client.emoji.fail;
    let serverCase = guildDB.report.reportCase;
    if (!serverCase || serverCase === null) serverCase = "1";
    let client = message.client;

    let reportColor = guildDB.report.reportcolor;
    if (reportColor == "#000000")
      reportColor = message.guild.members.me.displayHexColor;

    let user =
      message.mentions.users.first() || client.users.cache.get(args[1]);

    let properUsage = new MessageEmbed()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(`${language.reportt1.replace(/{prefix}/g, `${prefix}`)}`)
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` });

    if (args.length < 1) {
      return message.channel.sendCustom(properUsage);
    }

    if (args.includes("disable") || args.includes("off")) {
      if (!message.member.permissions.has("MANAGE_MESSAGES"))
        return message.channel
          .sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setTitle(`${fail} ${language.missingUser}`)
                .setDescription(`${language.missingUser1}`)
                .setTimestamp()
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
          })
          .setColor(message.guild.members.me.displayHexColor);

      if (guildDB.report.reportChannelID === null)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(
                `${message.client.emoji.fail} ${language.report4}`
              )
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        });
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          guild.report.reportChannelID = null;
          await guild.save().catch(() => {});

          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.guild.members.me.displayHexColor)
                .setDescription(
                  `${message.client.emoji.success} ${language.report5}`
                )
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
          });
        }
      );
    } else if (args.includes("enable")) {
      if (!message.member.permissions.has("MANAGE_MESSAGES"))
        return message.channel
          .sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${message.author.tag}`,
                  iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setTitle(`${fail} ${language.missingUser}`)
                .setDescription(`${language.missingUser1}`)
                .setTimestamp()
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
            ],
          })
          .setColor(message.guild.members.me.displayHexColor);

      const channel = await message.mentions.channels.first();

      if (!channel) return message.channel.sendCustom(properUsage);
      if (guildDB.report.reportChannelID === channel.id)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(`${fail} ${channel} ${language.report6}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        });
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          guild.report.reportChannelID = channel.id;
          await guild.save().catch(() => {});

          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.guild.members.me.displayHexColor)
                .setDescription(
                  `${message.client.emoji.success} ${language.report7} ${channel}`
                ),
            ],
          });
        }
      );
    } else if (args.includes("issue")) {
      if (guildDB.report.disableIssue == "true") {
        const embed = new MessageEmbed()
          .setColor(message.guild.members.me.displayHexColor)
          .setDescription(
            `Issue Reports are disabled in the current guild ${message.client.emoji.fail}`
          );

        return message.channel.sendCustom({ embeds: [embed] });
      }
      const serverReports = guildDB.report.reportChannelID;
      const channel = message.guild.channels.cache.get(serverReports);
      if (!channel)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report11}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      var acceptReason = args.splice(1).join(" ");
      if (!acceptReason)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report12}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (acceptReason.length < 5)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report13}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (acceptReason.length > 600 || args.join(" ").length > 600)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report14}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      let dmEmbed = new MessageEmbed()
        .setAuthor({
          name: `${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ format: "png" }),
        })
        .setDescription(`${language.report15}`)
        .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
        .setTimestamp()
        .setColor(message.client.color.green);

      let reportEmbed1 = new MessageEmbed()
        .setAuthor({ name: `${language.report16} (Issue)` })
        .setDescription(`**${language.report17}**`)
        .addFields(
          {
            name: `${language.report18}`,
            value: `${message.member}`,
            inline: true,
          },
          {
            name: `${language.report19}`,
            value: `${message.member.id}`,
            inline: true,
          },
          {
            name: `${language.report20}`,
            value: `${message.author.tag}`,
            inline: true,
          },
          {
            name: `${language.report24}`,
            value: `${message.channel}`,
            inline: true,
          },
          {
            name: `${language.report25}`,
            value: `${moment(new Date()).format("dddd, MMMM Do YYYY")}`,
            inline: true,
          },
          {
            name: `${language.report26}`,
            value: `${language.report29} #${serverCase}`,
            inline: true,
          },
          { name: `${language.report27}`, value: `\`\`\`${acceptReason}\`\`\`` }
        )
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(reportColor);

      guildDB.report.reportCase = serverCase + 1;
      await guildDB.save().catch(() => {});

      channel
        .send({ embeds: [reportEmbed1] })
        .then(async (reportEmbed) => {
          if (guildDB.isPremium == "true") {
            if (guildDB.report.upvote == "true") {
              if (guildDB.report.reaction == "1") {
                reportEmbed.react("⬆️").catch(() => {});
                await delay(750);
                reportEmbed.react("⬇️").catch(() => {});
              } else if (guildDB.report.reaction == "2") {
                reportEmbed.react("👍").catch(() => {});
                await delay(750);
                reportEmbed.react("👎").catch(() => {});
              } else if (guildDB.report.reaction == "3") {
                reportEmbed.react("✅").catch(() => {});
                await delay(750);
                reportEmbed.react("❌").catch(() => {});
              } else {
                reportEmbed.react("⬆️").catch(() => {});
                await delay(750);
                reportEmbed.react("⬇️").catch(() => {});
              }
            }
          }
        })
        .catch(() => {
          return message.channel.sendCustom(`${language.report28}`);
        });

      message.delete().catch(() => {});
      message.author.send({ embeds: [dmEmbed] }).catch(() => {});
    } else if (args.includes("user")) {
      if (guildDB.report.disableUser == "true") {
        message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.guild.members.me.displayHexColor)
              .setDescription(
                `User Reports are disabled in the current guild ${message.client.emoji.fail}`
              ),
          ],
        });
        return;
      }
      if (!user) return message.channel.sendCustom(properUsage);
      if (user.id === message.author.id)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report8}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (user.bot)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report9}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (
        !guildDB.report.reportChannelID ||
        !guildDB.report.reportChannelID === null
      )
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report10}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      let serverReports = guildDB.report.reportChannelID;
      let channel = message.guild.channels.cache.get(serverReports);
      if (!channel)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report11}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      acceptReason = args.splice(2).join(" ");
      if (!acceptReason)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report12}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (acceptReason.length < 5)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report13}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      if (acceptReason.length > 600 || args.join(" ").length > 600)
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ format: "png" }),
              })
              .setDescription(`${fail} ${language.report14}`)
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setTimestamp()
              .setColor("RED"),
          ],
        });

      let dmEmbed = new MessageEmbed()
        .setAuthor({
          name: `${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ format: "png" }),
        })
        .setDescription(`${language.report15}`)
        .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
        .setTimestamp()
        .setColor(message.client.color.green);

      let reportEmbed1 = new MessageEmbed()
        .setAuthor({ name: `${language.report16} (User)` })
        .setDescription(`**${language.report17}**`)
        .addFields(
          {
            name: `${language.report18}`,
            value: `${message.member}`,
            inline: true,
          },
          {
            name: `${language.report19}`,
            value: `${message.member.id}`,
            inline: true,
          },
          {
            name: `${language.report20}`,
            value: `${message.author.tag}`,
            inline: true,
          },
          { name: `${language.report21}`, value: `${user}`, inline: true },
          { name: `${language.report22}`, value: `${user.id}`, inline: true },
          { name: `${language.report23}`, value: `${user.tag}`, inline: true },
          {
            name: `${language.report24}`,
            value: `${message.channel}`,
            inline: true,
          },
          {
            name: `${language.report25}`,
            value: `${moment(new Date()).format("dddd, MMMM Do YYYY")}`,
            inline: true,
          },
          {
            name: `${language.report26}`,
            value: `${language.report29} #${serverCase}`,
            inline: true,
          },
          { name: `${language.report27}`, value: `\`\`\`${acceptReason}\`\`\`` }
        )
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(reportColor);

      guildDB.report.reportCase = serverCase + 1;
      await guildDB.save().catch(() => {});
      channel
        .send({ embeds: [reportEmbed1] })
        .then(async (reportEmbed) => {
          if (guildDB.isPremium == "true") {
            if (guildDB.report.upvote == "true") {
              if (guildDB.report.reaction == "1") {
                reportEmbed.react("⬆️").catch(() => {});
                await delay(750);
                reportEmbed.react("⬇️").catch(() => {});
              } else if (guildDB.report.reaction == "2") {
                reportEmbed.react("👍").catch(() => {});
                await delay(750);
                reportEmbed.react("👎").catch(() => {});
              } else if (guildDB.report.reaction == "3") {
                reportEmbed.react("✅").catch(() => {});
                await delay(750);
                reportEmbed.react("❌").catch(() => {});
              } else {
                reportEmbed.react("⬆️").catch(() => {});
                await delay(750);
                reportEmbed.react("⬇️").catch(() => {});
              }
            }
          }
        })
        .catch(() => {
          return message.channel.sendCustom(`${language.report28}`);
        });

      message.delete().catch(() => {});
      message.author.send({ embeds: [dmEmbed] }).catch(() => {});
    } else if (args[0]) {
      message.channel.sendCustom(properUsage);
    } else {
      message.channel.sendCustom(properUsage);
    }
  }
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
