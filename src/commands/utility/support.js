const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const Discord = require("discord.js");
const config = require("../../../config.json");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "support",
      description: `Sends you Neonova's Support server`,
      category: "Utility",
      cooldown: 3,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const embed = new Discord.MessageEmbed()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(
        `${language.support}(${config.discord}) ${message.client.emoji.success}`
      );

    await message.channel.sendCustom({ embeds: [embed] });
  }
};
