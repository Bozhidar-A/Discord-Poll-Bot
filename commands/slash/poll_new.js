const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

function TextBuilder(pollOptions, pollStatus) {
  let tmp = "";
  for (let i = 0; i < pollOptions.length; i++) {
    tmp += `${++i}. - ${pollOptions[--i]} (${pollStatus[i]} votes)\n`;
  }
  return tmp;
}

module.exports = {
  name: "poll_new",
  description: "Deletes all poll channels",
  options: [
    // {
    //   name: "lenght",
    //   description: "For how long the poll will go on in seconds",
    //   required: true,
    //   type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
    // },
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
    await interaction.deferReply({ ephemeral: false }).catch(() => {});

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

      //   return interaction.editReply({
      //     content: "Working on it",
      //   });
    }

    //can use the command

    function PollsCategoryGetter(msg) {
      return msg.member.guild.channels.cache.find(
        (channel) => channel.name === "Polls"
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
              id: message.guild.roles.everyone.id,
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
    for (let i = 0; i < pollOptions.length; ) {
      pollStatus[++i] = 0;
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

        // let button = new Discord.MessageButton()
        //   .setStyle("PRIMARY")
        //   .setCustomId("1")
        //   .setLabel("1");

        var row = new Discord.MessageActionRow();
        var optionsMsg = "";
        var bruh = "bruh";
        //.addComponents(button);

        for (let i = 0; i < pollOptions.length; ) {
          optionsMsg += pollOptions[i] + "\n";
          i++;
          row.addComponents(
            new Discord.MessageButton()
              .setStyle("PRIMARY")
              .setCustomId(`${i}`)
              .setLabel(`${i}`)
          );
        }

        // for (let i = 0; i < pollOptions.length; ) {
        //   optionsMsg += `${++i}. - ${pollOptions[--i]} (${
        //     pollStatus[i]
        //   } votes)\n`;
        // }

        pch
          .send({
            content: `${interaction.options.getString("question")}\n${bruh}`,
            components: [row],
          })
          .then((msg) => {
            //seting up collector
            let votedUsers = [];
            const filter = (button) => true; //???
            const collector = msg.channel.createMessageComponentCollector({
              filter,
              time: 15000,
            });

            collector.on("collect", async (e) => {
              // e.deferUpdate();
              if (votedUsers.includes(e.user.id)) {
                e.reply({
                  content: "Sorry but you can vote only once",
                  ephemeral: true,
                });
              } else {
                votedUsers.push(e.user.id);
                pollStatus[e.customId] += 1;
                // optionsMsg = "";
                // for (let i = 0; i < pollOptions.length; ) {
                //   optionsMsg += `${++i}. - ${pollOptions[--i]} (${
                //     pollStatus[i]
                //   } votes)\n`;
                // }
                msg.edit({ content: `${bruh}`, components: [row] });
                e.reply({ content: "Thanks for your vote!", ephemeral: true });
              }

              // msg.edit("bruh");
            });

            collector.on("end", (collected) => {
              console.log(collected);
              console.log(pollStatus);
              //disable buttons
              row.components.map((com) => com.setDisabled(true));
              msg.edit({
                content: `${interaction.options.getString(
                  "question"
                )}\n${bruh}`,
                components: [row],
              });

              //count votes
            });
          });
      });
  },
};
