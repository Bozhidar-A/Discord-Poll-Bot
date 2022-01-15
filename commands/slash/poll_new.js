const Discord = require("discord.js");

function TextBuilder(pollOptions, pollStatus, question) {
  let tmp = `${question}\n`;
  for (let i = 0; i < pollOptions.length; i++) {
    tmp += `${++i}. - ${pollOptions[--i]} (${pollStatus[i]} votes)\n`;
  }

  tmp += "WARNING: You can vote only once!\n";

  return tmp;
}

function GetMax(object) {
  return Object.keys(object).filter((x) => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
}

module.exports = {
  name: "poll_new",
  description: "Deletes all poll channels",
  options: [
    {
      name: "length",
      description: "For how long the poll will go on in seconds",
      required: true,
      type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
    },
    {
      name: "question",
      description: "The question",
      required: true,
      type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
    },
    {
      name: "all_options",
      description:
        "All options seperated by |. Example: Yes | No. Will give to options yes and no",
      required: true,
      type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
    },
  ],
  run: async (client, interaction, args) => {
    await interaction
      .reply({ content: "The poll is live!", ephemeral: true })
      .catch(() => {});

    const permissions = ["MENTION_EVERYONE", "ADMINISTRATOR"];
    const authorPerms = interaction.channel.permissionsFor(interaction.member);

    if (authorPerms) {
      permissions.map((per) => {
        if (!authorPerms.has(per)) {
          return interaction.editReply({
            content: "You do not have acces to this command",
          });
        }
      });
    }

    //can use the command

    function PollsCategoryGetter(msg) {
      return msg.member.guild.channels.cache.find(
        (channel) => channel.name === "Polls" //case sensitive!
      );
    }

    var pollsCategory = PollsCategoryGetter(interaction);
    //gets polls category
    //if not found pollsCategory will be undefined

    if (pollsCategory === undefined) {
      interaction.member.guild.channels
        .create("Polls", {
          type: "GUILD_CATEGORY",
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
            },
          ],
        })
        .then((pc) => {
          pollsCategory = pc;
        })
        .catch((e) => {
          console.log(e);
        });
    } //polls category doesn't exist. Create it

    var pollOptions = interaction.options.getString("all_options").split("|");
    var pollStatus = {};
    for (let i = 0; i < pollOptions.length; i++) {
      pollStatus[i] = 0;
    }

    interaction.member.guild.channels
      .create(interaction.options.getString("question"), {
        type: "text",
        permissionOverwrites: [
          {
            id: interaction.member.guild.roles.everyone.id,
            deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
          },
        ],
      })
      .then((pch) => {
        pch.setParent(pollsCategory.id);

        var row = new Discord.MessageActionRow();

        for (let i = 0; i < pollOptions.length; ) {
          row.addComponents(
            new Discord.MessageButton()
              .setStyle("PRIMARY")
              .setCustomId(`${i}`)
              .setLabel(`${++i}`) //visual +1
          );
        }

        pch
          .send({
            content: `${TextBuilder(
              pollOptions,
              pollStatus,
              interaction.options.getString("question")
            )}`,
            components: [row],
          })
          .then((msg) => {
            //seting up collector
            let votedUsers = [];
            const filter = (button) => true; //???
            const collector = msg.channel.createMessageComponentCollector({
              filter,
              time: interaction.options.getInteger("length") * 1000,
            });

            collector.on("collect", async (e) => {
              if (votedUsers.includes(e.user.id)) {
                e.reply({
                  content: "Sorry but you can vote only once",
                  ephemeral: true,
                });
              } else {
                votedUsers.push(e.user.id);
                pollStatus[e.customId] += 1;
                msg.edit({
                  content: `${TextBuilder(
                    pollOptions,
                    pollStatus,
                    interaction.options.getString("question")
                  )}`,
                  components: [row],
                });
                e.reply({ content: "Thanks for your vote!", ephemeral: true });
              }
            });

            collector.on("end", (collected) => {
              console.log(pollStatus);
              //disable buttons
              row.components.map((com) => com.setDisabled(true));
              msg.edit({
                content: `${interaction.options.getString(
                  "question"
                )}\nThe poll is closed!`,
                components: [row],
              });

              pch.send({
                content: `@everyone\nThe poll has concluded and the final rankings are:\n${TextBuilder(
                  pollOptions,
                  pollStatus,
                  interaction.options.getString("question")
                )}`,
              });

              //count votes
              if (!Object.entries(pollStatus).some(([k, v]) => v > 0)) {
                //no one voted
                pch.send({ content: "No one appears to have voted..." });

                return;
              }
              let res = GetMax(pollStatus);
              if (res.length === 1) {
                //one result, just post it
                pch.send({
                  content: `It appears the winner is option ${
                    parseInt(res) + 1
                  } with ${pollStatus[res]} vote(s)!`,
                });
              } else {
                //some kind of tie
                pch.send({
                  content: `It appears there are multiple winners and they are ${res.map(
                    (item, i) => {
                      return `${i} - ${item}, `;
                    }
                  )}`,
                });
              }
            });
          });
      });
  },
};
