const fs = require("fs");
const Discord = require("discord.js");

const helpDescriptions = JSON.parse(
  fs.readFileSync("./descriptions.json", "utf-8")
);

module.exports = {
  name: "help",
  args: false,
  usage: "<command>",
  description: "You lost bro?",
  execute(message, args) {
    if (!args[0]) {
      let embed = new Discord.MessageEmbed()
        .setColor("#009911")
        .setTitle("Poll Help");

      Object.keys(helpDescriptions).forEach((i) => {
        embed.addField(i, helpDescriptions[i].desc, false);
        embed.addField(`${i} usage`, helpDescriptions[i].usage, false);
      });
      message.channel.send(embed);
    } else {
      message.channel.send(
        `${message.author} You most likely spelled the command wrong. Please check your spelling.`
      );
    }
  },
};
