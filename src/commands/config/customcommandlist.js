const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const customCommand = require("../../database/schemas/customCommand.js");
const Guild = require("../../database/schemas/Guild");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "customcommands",
      aliases: ["cclist", "customcommandlist", "ccmds", "customcmds", "ccs"],
      description: "Gives a list of custom commands",
      category: "Config",
      cooldown: 5,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    await customCommand.find(
      {
        guildId: message.guild.id,
      },
      (err, data) => {
        if (!data && !data.name)
          return message.channel.sendCustom(
            `${message.client.emoji.fail} ${language.cc5}`
          );
        let array = [];
        data.map((d) => array.push(d.name));

        let embed = new MessageEmbed()
          .setColor("PURPLE")
          .setTitle(`${language.cc6}`)

          .setFooter({ text: message.guild.name });

        if (!Array.isArray(array) || !array.length) {
          embed.setDescription(`${language.cc5}`);
        } else {
          embed.setDescription(array.join(" - "));
        }
        message.channel.sendCustom({ embeds: [embed] });
      }
    );
  }
};
