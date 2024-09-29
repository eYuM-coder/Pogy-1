const { relativeTimeRounding } = require("moment");
const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
module.exports = class EmptyCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "mute",
      aliases: [],
      description: "mute a member in ms",
      category: "General",
      cooldown: 5,
    });
  }

  async run(message, args) {
    try {
      const timeString = args[1];
      const timeoutDuration = ms(timeString);
      const reason = args[2];
      if (isNaN(timeoutDuration)) {
        return message.channel.send(
          "Please provide a valid numerical time for the timeout."
        );
      }

      const User = message.mentions.members.first();
      // checks for a user
      if (!User) {
        return message.channel.send("Please mention a user to mute.");
      }
      // cant mute your self retard
      if (message.author.id === User.id) {
        return message.channel.send("You cannot mute yourself.");
      }
      // perms lol
      if(!message.member.permissions.has('MUTE_MEMBERS')) {
        return msg.channel.send(":x: You don't have permissions. :x:") 
      }
      // check roles for postions
      if (!message.member.roles.highest.comparePositionTo(User.roles.highest) > 0) {
        return message.channel.send("You cannot mute someone with a higher or equal role.");
      }
      
      await User.timeout(timeoutDuration, `${reason}`);
      // Chore : convert to embed
      const embed = new MessageEmbed()
        .setColor("#fe0a0a")
        .setDescription(`User has been timed out for ${ms(timeString)} ${reason}`)
        .setFooter(
          message.member.displayName,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setAuthor(
          message.author.username,
          message.author.displayAvatarURL({ dynamic: true })
        );
      await message.channel.send({ embeds: [embed] }); // Use timeString for clarity
    } catch (error) {
      console.error("Error in the empty command:", error);
      message.channel.send("An error occurred. Please try again later.");
    }
  }
};
