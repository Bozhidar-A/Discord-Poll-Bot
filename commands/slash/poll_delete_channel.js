const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
  name: "poll_delete_channel",
  description: "Deletes specific poll channel",
  options: [
    {
      name: "the_id",
      description:
        "Get the ID by right clicking the channel and clicking 'Copy ID'",
      required: true,
      type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
    },
  ],
  run: async (client, interaction, args) => {
    let { commandName, options } = interaction;

    let pollChannel = interaction.guild.channels.cache.find(
      (category) => category.id === options.getString("pChannelID")
    );

    pollChannel.delete();

    interaction.reply({
      content: "Poll bot channel removed",
    });
  },
};
