const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("nuke")
  .setDescription("Nukes a server (FAKE)")
  .setContexts([0, 1, 2])
  .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    interaction.reply({ content: `https://tenor.com/view/explosion-mushroom-cloud-atomic-bomb-bomb-gif-4464831` })
    .catch(() => {});
  }
}