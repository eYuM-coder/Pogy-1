const Event = require("../../structures/Event");
const Discord = require("discord.js");
const logger = require("../../utils/logger");
const Guild = require("../../database/schemas/Guild");
const Logging = require("../../database/schemas/logging");
const config = require("../../../config.json");
const webhookClient = new Discord.WebhookClient({
  url: config.webhooks.joinsPublic,
});
const welcomeClient = new Discord.WebhookClient({
  url: config.webhooks.joinsPrivate,
});

module.exports = class extends Event {
  async run(guild) {
    logger.info(`Joined to "${guild.name}" (${guild.id})`, { label: "Guilds" });

    const find = await Guild.findOne({
      guildId: guild.id,
    });

    if (!find) {
      const guildConfig = await Guild.create({
        guildId: guild.id,
        language: "english",
      });
      await guildConfig.save().catch(() => {});
    }

    var textChats = guild.channels.cache.find(
      (ch) =>
        ch.type === "GUILD_TEXT" &&
        ch
          .permissionsFor(guild.members.me)
          .has(["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS"])
    );

    const modLog = guild.channels.cache.find(
      (c) =>
        c.name.replace("-", "").replace("s", "") === "modlog" ||
        c.name.replace("-", "").replace("s", "") === "moderatorlog"
    );

    let muteRole = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === "muted"
    );
    if (!muteRole) {
      try {
        muteRole = await guild.roles.create({
          data: {
            name: "Muted",
            permissions: [],
          },
        });
      } catch (e) {
        // do nothing
      }
      for (const channel of guild.channels.cache.values()) {
        try {
          if (
            channel.viewable &&
            channel.permissionsFor(guild.members.me).has("MANAGE_ROLES")
          ) {
            if (channel.type === "GUILD_TEXT")
              await channel.permissionOverwrites.edit(muteRole, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
              });
            else if (channel.type === "GUILD_VOICE" && channel.editable)
              //
              await channel.permissionOverwrites.edit(muteRole, {
                SPEAK: false,
                STREAM: false,
              });
          }
        } catch (e) {
          // do nothing
        }
      }
    }

    const logging = await Logging.findOne({
      guildId: guild.id,
    });
    if (!logging) {
      const newL = await Logging.create({
        guildId: guild.id,
      });
      await newL.save().catch(() => {});
    }

    const logging2 = await Logging.findOne({
      guildId: guild.id,
    });

    if (logging2) {
      if (muteRole) {
        logging2.moderation.mute_role = muteRole.id;
      }

      if (modLog) {
        logging2.moderation.channel = modLog.id;
      }
      await logging2.save().catch(() => {});
    }

    if (textChats) {
      const embed = new Discord.MessageEmbed()
        .setColor("PURPLE")
        .setDescription(
          `Hey there! I'm **${config.botName}**.\n\nThank you for inviting me to your server, it means a lot to us! You can get started with [\`!help\`](${process.env.AUTH_DOMAIN}) & customise your server settings by accessing the dashboard [\`here\`](${process.env.AUTH_DOMAIN}/dashboard/${guild.id}).\n\n__**Current News**__\n\`\`\`\nWe are currently giving premium to all servers until 1000 guilds! If interested, please visit [this site](${process.env.AUTH_DOMAIN}/redeem).\`\`\`\n\nAgain, thank you for inviting me! (this server is now very pog)\n**- ${config.botName}**`
        )
        .addFields({
          name: "\u200b",
          value:
            "**[Invite](https://neonova.eyum.org/invite) | " +
            `[Support Server](${process.env.AUTH_DOMAIN}/support) | ` +
            `[Dashboard](${process.env.AUTH_DOMAIN}/dashboard)**`,
        });

      textChats.send({ embeds: [embed] }).catch(() => {});
    }

    const welcomeEmbed = new Discord.MessageEmbed()
      .setColor(this.client.color.green)
      .setTitle("New Server")
      .setThumbnail(`${process.env.AUTH_DOMAIN}/logo`)
      .setDescription(`${config.botName} was added to a new server!`)
      .addFields(
        { name: `Server Name`, value: `\`${guild.name}\``, inline: true },
        { name: `Server ID`, value: `\`${guild.id}\``, inline: true }
      )
      .setFooter({
        text: `${this.client.guilds.cache.size} guilds `,
        iconURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      });

    welcomeClient.sendCustom({
      username: `${config.botName}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [welcomeEmbed],
    });

    const embed = new Discord.MessageEmbed()
      .setColor(this.client.color.green)
      .setDescription(
        `I have joined the ${guild.name} server.\n\nID: ${guild.id}`
      )
      .setFooter({
        text: `Gained ${guild.members.cache.size - 1} members • I'm now in ${
          this.client.guilds.cache.size
        } servers!`,
      })
      .setThumbnail(
        guild.iconURL({ dynamic: true })
          ? guild.iconURL({ dynamic: true })
          : `https://guild-default-icon.herokuapp.com/${encodeURIComponent(
              guild.name
            )}`
      );

    webhookClient.sendCustom({
      username: `${this.client.user.username}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [embed],
    });
  }
};
