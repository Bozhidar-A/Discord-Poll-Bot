const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

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
    // {
    //   name: "all_options",
    //   description:
    //     "All options seperated by |. Example: Yes | No. Will give to options yes and no",
    //   required: true,
    //   type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
    // },
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

    interaction.member.guild.channels.create(
      interaction.options.getString("question"),
      {
        type: "text",
        permissionOverwrites: [
          {
            id: interaction.member.guild.roles.everyone.id,
            deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
          },
        ],
      }
    );
  },
};
