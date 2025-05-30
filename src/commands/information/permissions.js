const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const permissions = require("../../assets/json/permissions.json");
moment.suppressDeprecationWarnings = true;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "permissions",
      aliases: ["perms"],
      description: `Shows a user's permissions`,
      category: "Information",
      cooldown: 3,
    });
  }

  async run(message, args) {
    const member =
      getMemberFromMention(message, args[0]) ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    const memberPermissions = member.permissions.toArray();
    const finalPermissions = [];
    for (const permission in permissions) {
      if (memberPermissions.includes(permission))
        finalPermissions.push(`+ ${permissions[permission]}`);
      else finalPermissions.push(`- ${permissions[permission]}`);
    }

    const embed = new MessageEmbed()
      .setTitle(`${member.displayName}'s Permissions`)
      .setDescription(`\`\`\`diff\n${finalPermissions.join("\n")}\`\`\``)
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.members.me.displayHexColor);
    message.channel.sendCustom({ embeds: [embed] });
  }
};

function getMemberFromMention(message, mention) {
  if (!mention) return;
  const matches = mention.match(/^<@!?(\d+)>$/);
  if (!matches) return;
  const id = matches[1];
  return message.guild.members.cache.get(id);
}
