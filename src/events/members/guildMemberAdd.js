const Event = require("../../structures/Event");
const Guild = require("../../database/schemas/Guild");
const WelcomeDB = require("../../database/schemas/welcome");
const discord = require("discord.js");
const muteModel = require("../../database/models/mute");
const moment = require("moment");
const alt = require("../../database/models/altdetector.js");
const StickyDB = require("../../database/schemas/stickyRole");
const Logging = require("../../database/schemas/logging");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index.js");

module.exports = class extends Event {
  async run(member) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: member.guild.id });

    const muteDoc = await muteModel.findOne({
      guildID: member.guild.id,
      memberID: member.id,
    });

    if (muteDoc) {
      const muteRole = member.guild.roles.cache.find((r) => r.name == "Muted");

      if (muteRole)
        member.roles
          .add(muteRole.id, ["Mute Command / User left and Rejoined."])
          .catch(() => {});

      muteDoc.memberRoles = [];

      await muteDoc.save().catch(() => {});
    }

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await member.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = member.client.color.green;

          if (logging.server_events.member_join == "true") {
            const embed = new discord.MessageEmbed()
              .setTitle("📥 Member Joined")
              .setAuthor({
                name: `${member.guild.name}`,
                iconURL: member.guild.iconURL({ dynamic: true }),
              })
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .setDescription(`${member} (**${member.user.tag}**)`)
              .addFields({
                name: "Account created on",
                value: moment(member.user.createdAt).format(
                  "dddd, MMMM Do YYYY"
                ),
              })
              .setTimestamp()
              .setColor(member.guild.members.medisplayHexColor);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(member.guild.members.me)
                .has(["SEND_MESSAGES", "EMBED_LINKS"])
            ) {
              send(
                channelEmbed,
                { embeds: [embed] },
                {
                  name: `${this.client.user.username}`,
                  username: `${this.client.user.username}`,
                  icon: this.client.user.displayAvatarURL({
                    dynamic: true,
                    format: "png",
                  }),
                }
              ).catch(() => {});
            }
          }
        }
      }
    }

    let altDetector = await alt.findOne({ guildID: member.guild.id });
    if (altDetector) {
      if (altDetector.altToggle === true) {
        let arr = altDetector.allowedAlts;
        if (!arr.includes(member.id)) {
          let altLog = member.guild.channels.cache.get(altDetector.altModlog);

          let day = Number(altDetector.altDays);
          let x = Date.now() - member.user.createdAt;
          let created = Math.floor(x / 86400000);

          if (day >= created) {
            let action;
            if (
              altDetector.altAction &&
              altDetector.altAction.toLowerCase() === "ban"
            ) {
              await member
                .ban({ reason: "Alt Account | Alt Detector Module" })
                .catch(() => {});
              action = "Banned";
            }
            if (
              altDetector.altAction &&
              altDetector.altAction.toLowerCase() === "kick"
            ) {
              await member
                .kick({ reason: "Alt Account | Alt Detector Module" })
                .catch(() => {});
              action = "Kicked";
            }

            if (altLog) {
              if ((action && action === "Kicked") || action === "Banned") {
                const embedAlt = new discord.MessageEmbed()
                  .setColor("GREEN")
                  .setTitle(`Alt Detector | ${member.user.tag}`)
                  .setDescription(
                    `**${action} ${
                      member.user.tag
                    } From the guild.**\n\n**Reason:** Alt Detector\n\n__**Account Created at:**__ ${moment(
                      member.user.createdAt
                    ).format("MMMM Do YYYY, h:mm:ss a")}`
                  );
                send(
                  altLog,
                  { embeds: [embedAlt] },
                  {
                    name: `${this.client.user.username}`,
                    username: `${this.client.user.username}`,
                    icon: this.client.user.displayAvatarURL({
                      dynamic: true,
                      format: "png",
                    }),
                  }
                ).catch(() => {});
              }
            }
          }
        }
      }
    }

    let guildDB = await Guild.findOne({
      guildId: member.guild.id,
    });

    let welcome = await WelcomeDB.findOne({
      guildId: member.guild.id,
    });

    if (!welcome) {
      const newSettings = new WelcomeDB({
        guildId: member.guild.id,
      });
      await newSettings.save().catch(() => {});
      welcome = await WelcomeDB.findOne({ guildId: member.guild.id });
    }

    if (welcome.welcomeToggle == "true") {
      if (welcome.welcomeDM == "true") {
        let text = welcome.welcomeMessage
          .replace(/{user}/g, `${member}`)
          .replace(/{user_tag}/g, `${member.user.tag}`)
          .replace(/{user_name}/g, `${member.user.username}`)
          .replace(/{user_ID}/g, `${member.id}`)
          .replace(/{guild_name}/g, `${member.guild.name}`)
          .replace(/{guild_ID}/g, `${member.guild.id}`)
          .replace(
            /{memberCount}/g,
            `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
          )
          .replace(
            /{size}/g,
            `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
          )
          .replace(/{guild}/g, `${member.guild.name}`)
          .replace(
            /{member_createdAtAgo}/g,
            `${moment(member.user.createdTimestamp).fromNow()}`
          )
          .replace(
            /{member_createdAt}/g,
            `${moment(member.user.createdAt).format("MMMM Do YYYY, h:mm:ss a")}`
          );

        if (welcome.welcomeEmbed == "false") {
          member.send(`${text}`).catch(() => {});
        }
        if (welcome.welcomeEmbed == "true") {
          let embed = new discord.MessageEmbed();

          let color = welcome.embed.color;
          if (color) embed.setColor(color);

          let title = welcome.embed.title;
          if (title !== null) embed.setTitle(title);

          let titleUrl = welcome.embed.titleURL;
          if (titleUrl !== null) embed.setURL(titleUrl);

          let textEmbed = welcome.embed.description
            .replace(/{user}/g, `${member}`)
            .replace(/{user_tag}/g, `${member.user.tag}`)
            .replace(/{user_name}/g, `${member.user.username}`)
            .replace(/{user_ID}/g, `${member.id}`)
            .replace(/{guild_name}/g, `${member.guild.name}`)
            .replace(/{guild_ID}/g, `${member.guild.id}`)
            .replace(
              /{memberCount}/g,
              `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
            )
            .replace(
              /{size}/g,
              `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
            )
            .replace(/{guild}/g, `${member.guild.name}`)
            .replace(
              /{member_createdAtAgo}/g,
              `${moment(member.user.createdTimestamp).fromNow()}`
            )
            .replace(
              /{member_createdAt}/g,
              `${moment(member.user.createdAt).format(
                "MMMM Do YYYY, h:mm:ss a"
              )}`
            );

          if (textEmbed !== null) embed.setDescription(textEmbed);

          let authorName = welcome.embed.author.name
            .replace(/{user_tag}/g, `${member.user.tag}`)
            .replace(/{user_name}/g, `${member.user.username}`)
            .replace(/{user_ID}/g, `${member.id}`)
            .replace(/{guild_name}/g, `${member.guild.name}`)
            .replace(/{guild_ID}/g, `${member.guild.id}`)
            .replace(
              /{memberCount}/g,
              `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
            )
            .replace(
              /{size}/g,
              `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
            )
            .replace(/{guild}/g, `${member.guild.name}`);

          if (authorName !== null) embed.setAuthor({ name: authorName });

          let authorIcon = welcome.embed.author.icon;
          if (authorIcon !== null)
            embed.setAuthor({ name: authorName, iconURL: authorIcon });

          let authorUrl = welcome.embed.author.url;
          if (authorUrl !== null)
            embed.setAuthor({
              name: authorName,
              iconURL: authorIcon,
              url: authorUrl,
            });

          let footer = welcome.embed.footer;
          if (footer !== null) embed.setFooter(footer);

          let footerIcon = welcome.embed.footerIcon;
          if (footer && footerIcon !== null)
            embed.setFooter({ name: footer, iconURL: footerIcon });

          let timestamp = welcome.embed.timestamp;
          if (timestamp == "true") embed.setTimestamp();

          let thumbnail = welcome.embed.thumbnail;
          if (thumbnail === "{userAvatar}")
            thumbnail = member.user.displayAvatarURL({
              dynamic: true,
              size: 512,
            });
          if (thumbnail !== null) embed.setThumbnail(thumbnail);

          let image = welcome.embed.image;
          if (image === "{userAvatar}")
            image = member.user.displayAvatarURL({ dynamic: true, size: 512 });
          if (image !== null) embed.setImage(image);

          member.send({ embeds: [embed] }).catch(() => {});
        }
      }
      if (welcome.welcomeDM == "false") {
        if (welcome.welcomeChannel) {
          const greetChannel = member.guild.channels.cache.get(
            welcome.welcomeChannel
          );
          if (greetChannel) {
            let text = welcome.welcomeMessage
              .replace(/{user}/g, `${member}`)
              .replace(/{user_tag}/g, `${member.user.tag}`)
              .replace(/{user_name}/g, `${member.user.username}`)
              .replace(/{user_ID}/g, `${member.id}`)
              .replace(/{guild_name}/g, `${member.guild.name}`)
              .replace(/{guild_ID}/g, `${member.guild.id}`)
              .replace(
                /{memberCount}/g,
                `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
              )
              .replace(
                /{size}/g,
                `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
              )
              .replace(/{guild}/g, `${member.guild.name}`)
              .replace(
                /{member_createdAtAgo}/g,
                `${moment(member.user.createdTimestamp).fromNow()}`
              )
              .replace(
                /{member_createdAt}/g,
                `${moment(member.user.createdAt).format(
                  "MMMM Do YYYY, h:mm:ss a"
                )}`
              );

            if (welcome.welcomeEmbed == "false") {
              if (
                greetChannel &&
                greetChannel.viewable &&
                greetChannel
                  .permissionsFor(member.guild.members.me)
                  .has(["SEND_MESSAGES", "EMBED_LINKS"])
              ) {
                greetChannel.send(`${text}`).catch(() => {});
              }
            }
            if (welcome.welcomeEmbed == "true") {
              let embed = new discord.MessageEmbed();

              let color = welcome.embed.color;
              if (color) embed.setColor(color);

              let title = welcome.embed.title;
              if (title !== null) embed.setTitle(title);

              let titleUrl = welcome.embed.titleURL;
              if (titleUrl !== null) embed.setURL(titleUrl);

              let textEmbed = welcome.embed.description
                .replace(/{user}/g, `${member}`)
                .replace(/{user_tag}/g, `${member.user.tag}`)
                .replace(/{user_name}/g, `${member.user.username}`)
                .replace(/{user_ID}/g, `${member.id}`)
                .replace(/{guild_name}/g, `${member.guild.name}`)
                .replace(/{guild_ID}/g, `${member.guild.id}`)
                .replace(
                  /{memberCount}/g,
                  `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
                )
                .replace(
                  /{size}/g,
                  `${member.guild.members.cache.reduce(
                    (a, b) => a + b,
                    0
                  )}`
                )
                .replace(/{guild}/g, `${member.guild.name}`)
                .replace(
                  /{member_createdAtAgo}/g,
                  `${moment(member.user.createdTimestamp).fromNow()}`
                )
                .replace(
                  /{member_createdAt}/g,
                  `${moment(member.user.createdAt).format(
                    "MMMM Do YYYY, h:mm:ss a"
                  )}`
                );

              if (textEmbed !== null) embed.setDescription(textEmbed);

              let authorName = welcome.embed.author.name
                .replace(/{user_tag}/g, `${member.user.tag}`)
                .replace(/{user_name}/g, `${member.user.username}`)
                .replace(/{user_ID}/g, `${member.id}`)
                .replace(/{guild_name}/g, `${member.guild.name}`)
                .replace(/{guild_ID}/g, `${member.guild.id}`)
                .replace(
                  /{memberCount}/g,
                  `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
                )
                .replace(
                  /{size}/g,
                  `${member.guild.members.cache.reduce((a, b) => a + b, 0)}`
                )
                .replace(/{guild}/g, `${member.guild.name}`);

              if (authorName !== null) embed.setAuthor({ name: authorName });

              let authorIcon = welcome.embed.author.icon;
              if (authorIcon !== null)
                embed.setAuthor({ name: authorName, iconURL: authorIcon });

              let authorUrl = welcome.embed.author.url;
              if (authorUrl !== null)
                embed.setAuthor({
                  name: authorName,
                  iconURL: authorIcon,
                  url: authorUrl,
                });

              let footer = welcome.embed.footer;
              if (footer !== null) embed.setFooter(footer);

              let footerIcon = welcome.embed.footerIcon;
              if (footer && footerIcon !== null)
                embed.setFooter({ name: footer, iconURL: footerIcon });

              let timestamp = welcome.embed.timestamp;
              if (timestamp == "true") embed.setTimestamp();

              let thumbnail = welcome.embed.thumbnail;
              if (thumbnail === "{userAvatar}")
                thumbnail = member.user.displayAvatarURL({
                  dynamic: true,
                  size: 512,
                });
              if (thumbnail !== null) embed.setThumbnail(thumbnail);

              let image = welcome.embed.image;
              if (image === "{userAvatar}")
                image = member.user.displayAvatarURL({
                  dynamic: true,
                  size: 512,
                });
              if (image !== null) embed.setImage(image);

              if (
                greetChannel &&
                greetChannel.viewable &&
                greetChannel
                  .permissionsFor(member.guild.members.me)
                  .has(["SEND_MESSAGES", "EMBED_LINKS"])
              ) {
                greetChannel.send({ embeds: [embed] }).catch(() => {});
              }
            }
          }
        }
      }
    }

    if (guildDB && guildDB.autoroleToggle && guildDB.autoroleToggle === true) {
      if (guildDB.autoroleID) {
        let role = member.guild.roles.cache.get(guildDB.autoroleID);
        if (role) {
          member.roles.add(role).catch(() => {});
        }
      }
    }

    let sticky = await StickyDB.findOne({
      guildId: member.guild.id,
    });

    if (!sticky) {
      const newSettingss = new StickyDB({
        guildId: member.guild.id,
      });
      await newSettingss.save().catch(() => {});
      sticky = await StickyDB.findOne({ guildId: member.guild.id });
    }

    if (sticky) {
      let stickyRoleID = sticky.stickyroleID;
      let stickyRole = member.guild.roles.cache.get(stickyRoleID);
      if (sticky.stickyroleToggle == "true") {
        if (stickyRole) {
          if (
            !member.roles.cache.find(
              (r) => r.name.toLowerCase() === stickyRole.name
            )
          ) {
            if (sticky.stickyroleUser.includes(member.id)) {
              await member.roles.add(stickyRole).catch(() => {});
            }
          }
        }
      }
    }
  }
};
