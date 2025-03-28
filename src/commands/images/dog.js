const Command = require("../../structures/Command");
const fetch = require("node-fetch");
const Guild = require("../../database/schemas/Guild");
const discord = require("discord.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "dog",
      description: "Get a cute dog picture!",
      category: "Images",
      cooldown: 5,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);
    try {
      const res = await fetch("https://dog.ceo/api/breeds/image/random");
      const img = (await res.json()).message;
      const embed = new discord.MessageEmbed()
        .setImage(img)
        .setFooter({ text: "/dog.ceo/api/breeds/image/random" })
        .setColor(message.guild.members.me.displayHexColor);
      message.channel.sendCustom({ embeds: [embed] });
    } catch (err) {
      console.log(`${err}, command name: dog`);
      message.reply(language.birdError);
    }
  }
};
