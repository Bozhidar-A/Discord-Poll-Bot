const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
  name: "poll_nuke",
  description: "Deletes all poll channels",
  run: async (client, interaction, args) => {
    let pollCategory = interaction.guild.channels.cache.find(
      (channel) => cahnnel.id === "Polls"
    );

    Promise.all(
      pollCategory.children.map((channel) => {
        channel.delete();
      })
    ).then(() => {
      pollCategory.delete();
    });

    interaction.reply({
      content: "All Poll bot channels and categories removed",
    });
  },
};
