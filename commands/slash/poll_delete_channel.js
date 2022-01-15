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
    let { options } = interaction;

    let pollChannel = interaction.guild.channels.cache.find(
      (channel) =>
        channel.id === options.getString("the_id") &&
        channel.parent.name === "Polls" //to prevent this bot being used to delete other channels
    );

    console.log(pollChannel.parent);

    pollChannel.delete();

    interaction.reply({
      content: "Poll bot channel removed",
    });
  },
};
