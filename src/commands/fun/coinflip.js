const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "coinflip",
      description: "Flip a coin",
      category: "Fun",
      aliases: ["cointoss"],
      cooldown: 3,
    });
  }

  async run(message) {
    const client = message.client;
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const n = Math.floor(Math.random() * 2);
    let result;
    if (n === 1) result = "heads";
    else result = "tails";

    const embed = new MessageEmbed()
      .setDescription(`\`${language.flippingCoin}\``)
      .setColor(message.guild.members.me.displayHexColor);

    const msg = await message.channel.sendCustom({ embeds: [embed] });

    const embe2 = new MessageEmbed()
      .setDescription(
        `${language.coiniflippedacoinfor} ${message.member}, ${language.coinitwas}** ${result}**`
      )
      .setColor(client.color.blue);
    msg.edit(embe2).catch(() => {});
  }
};
