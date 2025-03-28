const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
const ReactionRole = require("../../packages/reactionrole/index.js");
const react = new ReactionRole();

require("dotenv").config();
react.setURL(process.env.MONGO);

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "rrdm",
      aliases: ["reactionrolesdm", "rrdirectmessages"],
      description: "Enable / Disable Reaction Role DMs",
      category: "Reaction Role",
      cooldown: 3,
      usage: "on / off",
      userPermission: ["MANAGE_GUILD"],
    });
  }

  async run(message, args) {
    let client = message.client;

    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    let fail = message.client.emoji.fail;
    let success = message.client.emoji.success;
    const prefix = guildDB.prefix;

    if (guildDB.isPremium == "false") {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.guild.members.me.displayHexColor)
            .setDescription(
              `${fail} Slow down here, the current command is only for premium guilds.\n\n[Check Premium Here](${process.env.AUTH_DOMAIN}/premium)`
            ),
        ],
      });
    }

    let properUsage = new MessageEmbed()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(
        `__**Proper Usage**__\n\n\`1-\` ${prefix}rrdm on\n\`2-\` ${prefix}rrdm off`
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` });

    if (args.length < 1) {
      return message.channel.sendCustom(properUsage);
    }

    if (args.includes("disable") || args.includes("off")) {
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          if (guild.reactionDM === false)
            return message.channel
              .sendCustom({
                embeds: [
                  new MessageEmbed()
                    .setAuthor({
                      name: message.author.tag,
                      iconURL: message.author.displayAvatarURL(),
                    })
                    .setDescription(`${fail} DMs are already disabled`)
                    .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
                ],
              })
              .setColor(client.color.red);

          guild
            .updateOne({
              reactionDM: false,
            })
            .catch((err) => console.error(err));
        }
      );
      message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${success} Reaction Role DMs have been disabled!`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });
    } else if (args.includes("enable") || args.includes("on")) {
      await Guild.findOne(
        {
          guildId: message.guild.id,
        },
        async (err, guild) => {
          if (guild.reactionDM === true)
            return message.channel.sendCustom({
              embeds: [
                new MessageEmbed()
                  .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL(),
                  })
                  .setDescription(`${fail} DMs are already enabled`)
                  .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                  .setColor(client.color.red),
              ],
            });
          guild
            .updateOne({
              reactionDM: true,
            })
            .catch((err) => console.error(err));

          message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: message.author.tag,
                  iconURL: message.author.displayAvatarURL(),
                })
                .setDescription(
                  `${success} Reaction Role DMs have been enabled!`
                )
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
                .setColor(client.color.red),
            ],
          });
        }
      );
    } else if (args[0]) {
      message.channel.sendCustom(properUsage);
    } else {
      message.channel.sendCustom(properUsage);
    }
  }
};
