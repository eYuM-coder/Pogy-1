const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const Discord = require("discord.js");
const ms = require("ms");
let reminderstarted = new Set();
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "remind",
      description: "Get reminded to do something!",
      category: "Utility",
      cooldown: 3,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    if (reminderstarted.has(message.author.id))
      return message.channel.sendCustom(`${language.remind1}`);

    message.channel.sendCustom(`${language.remind2}`).catch(() => {});
    let filter = (m) => m.author.id == message.author.id;
    message.channel
      .awaitMessages({ filter, max: 1, time: 30000 })
      .then((collected) => {
        if (collected.first().content.toLowerCase() == "start") {
          reminderstarted.add(message.author.id);

          message.channel.sendCustom(`${language.remind3}`).catch(() => {});
          let filter2 = (m) => m.author.id == message.author.id;
          message.channel
            .awaitMessages({ filter: filter2, max: 1, time: 30000 })
            .then((collected) => {
              if (collected.first().content.length < 1024) {
                let reminder = collected.first().content;
                message.channel.sendCustom(`${language.remind4} **[s/m/h/d]**`);
                let filter3 = (m) => m.author.id == message.author.id;
                message.channel
                  .awaitMessages({ filter: filter3, max: 1, time: 30000 })
                  .then((collected) => {
                    let valid = collected.first().content;
                    let time = ms(valid);

                    if (!isNaN(ms(collected.first().content))) {
                      if (time > 86400000) {
                        message.channel.sendCustom(
                          `${message.client.emoji.fail} Please provide a date less than **1 day**`
                        );
                        reminderstarted.delete(message.author.id);
                        return;
                      }

                      let reminderTime = valid;
                      message.channel
                        .sendCustom(`${language.remind5}`)
                        .catch(() => {});
                      let filter4 = (m) => m.author.id == message.author.id;
                      message.channel
                        .awaitMessages({ filter: filter4, max: 1, time: 30000 })
                        .then((collected) => {
                          if (
                            collected.first().content.toLowerCase() == "yes"
                          ) {
                            let remindEmbed = new Discord.MessageEmbed()
                              .setColor("0x43f033")
                              .setAuthor({ name: `${language.remind6}` })
                              .setDescription(
                                `${language.remind7
                                  .replace("${reminder}", `${reminder}`)
                                  .replace(
                                    "${reminderTime}",
                                    `${reminderTime}`
                                  )}`
                              )
                              .setTimestamp();
                            message.channel
                              .sendCustom(remindEmbed)
                              .catch(() => {});

                            let guild = message.guild;
                            setTimeout(function () {
                              let remindEmbed = new Discord.MessageEmbed()
                                .setColor("#00e9ff")

                                .setAuthor({ name: `${language.remind8}` })
                                .setDescription(`${language.remind9}`)
                                .addFields(
                                  {
                                    name: `${language.remind10}`,
                                    value: `${guild.name}`,
                                    inline: true,
                                  },
                                  {
                                    name: `${language.remind11}`,
                                    value: `${reminderTime}`,
                                    inline: true,
                                  },
                                  {
                                    name: `${language.remind12}`,
                                    value: `"${reminder}"`,
                                    inline: true,
                                  }
                                )
                                .setTimestamp();
                              reminderstarted.delete(message.author.id);
                              message.author
                                .send({ embeds: [remindEmbed] })
                                .catch(() => {
                                  message.channel.sendCustom(
                                    `${message.author}, ${language.remind13}`
                                  );
                                })
                                .catch(() => {});
                            }, ms(reminderTime));

                            return;
                          } else {
                            message.reply(
                              `${message.client.emoji.fail} ${language.remind14}`
                            );
                            reminderstarted.delete(message.author.id);
                          }
                        })
                        .catch(() => {
                          message.reply(
                            `${message.client.emoji.fail} ${language.remind15}`
                          );
                          reminderstarted.delete(message.author.id);
                        });

                      return;
                    } else {
                      message.reply(
                        `${message.client.emoji.fail} ${language.remind14}`
                      );
                      reminderstarted.delete(message.author.id);
                    }
                  })
                  .catch(() => {
                    message.reply(
                      `${message.client.emoji.fail} ${language.remind15}`
                    );
                    reminderstarted.delete(message.author.id);
                  });

                return;
              } else {
                message.reply(
                  `${message.client.emoji.fail} ${language.remind14}`
                );
                reminderstarted.delete(message.author.id);
              }
            })
            .catch(() => {
              message.reply(
                `${message.client.emoji.fail} ${language.remind15}`
              );
              reminderstarted.delete(message.author.id);
            });

          return;
        } else
          message.reply(`${message.client.emoji.fail} ${language.remind14}`);
        reminderstarted.delete(message.author.id);
      })
      .catch(() => {
        message.reply(`${message.client.emoji.fail} ${language.remind15}`);
        reminderstarted.delete(message.author.id);
      });
  }
};
