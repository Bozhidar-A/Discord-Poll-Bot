const fs = require("fs");
const Discord = require("discord.js");

const helpDescriptions = JSON.parse(
  fs.readFileSync("./descriptions.json", "utf-8")
);

module.exports = {
  name: "poll_help",
  description: "Show help Poll bot help menu",
  run: async (client, interaction, args) => {
    let embed = new Discord.MessageEmbed()
      .setColor("#009911")
      .setTitle("Poll Help");

    Object.keys(helpDescriptions).forEach((i) => {
      embed.addField(i, helpDescriptions[i].desc, false);
      embed.addField(`${i} usage`, helpDescriptions[i].usage, false);
    });

    embed.addField(
      "Check out the source code!",
      "[You can find it here!](https://github.com/Bozhidar-A/Discord-Poll-Bot)"
    );

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
