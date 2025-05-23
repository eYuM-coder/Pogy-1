const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Neonova");
const config = require("../../../config.json");
const Guildd = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
moment.suppressDeprecationWarnings = true;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "news",
      description: `Shows ${config.botName}'s latest news`,
      category: "Information",
      cooldown: 3,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({});

    const guildDB2 = await Guildd.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB2.language}.json`);

    if (!guildDB) return message.channel.sendCustom(`${language.noNews}`);

    let embed = new MessageEmbed()
      .setColor(message.guild.members.me.displayHexColor)
      .setTitle(`${message.client.config.botName} News`)
      .setDescription(
        `***__${language.datePublished}__ ${moment(guildDB.time).format(
          "dddd, MMMM Do YYYY"
        )}*** *__[\`(${moment(
          guildDB.time
        ).fromNow()})\`](${process.env.AUTH_DOMAIN}/)__*\n\n ${guildDB.news}`
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setTimestamp();

    message.channel.sendCustom({ embeds: [embed] }).catch(() => {
      message.channel.sendCustom(`${language.noNews}`);
    });
  }
};
