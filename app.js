const Discord = require("discord.js");
require("dotenv").config();

const client = new Discord.Client();

client.on("ready", () => {
  console.log("Bot is ready");
});

client.login(process.env.BOT_TOKEN);

var guildID = 0;
//res 785419755896307763

const helpEmbed = new Discord.MessageEmbed()
  .setTitle("Syntax:")
  .setDescription(
    "All arguments are prefixed with '-'. Example: !poll - {poll-duration-in-seconds} - {poll-question} - {first-poll-option}... - {last-poll-option}"
  );

client.on("message", (msg) => {
  try {
    let split = msg.content.split("-").map(function (item) {
      return item.trim();
    }); //this is bad
    if (split[0] !== "!poll") {
      return;
    }
    if (split[1] === "help") {
      msg.channel.send(helpEmbed);
    } else {
      let pollsCategory = null;
      let pollChannel = null;

      //check if category exists
      if (
        !msg.channel.guild.channels.cache.find(
          (channel) => channel.name === "Polls"
        )
      ) {
        //make if not
        msg.guild.channels
          .create("Polls", {
            type: "category",
          })
          .then((pc) => {
            pollsCategory = pc;
          });
      } //polls category exists
      else {
        pollsCategory = msg.channel.guild.channels.cache.find(
          (channel) => channel.name === "Polls"
        );
      }

      msg.guild.channels.create(split[2], { type: "text" }).then((pc) => {
        pc.setParent(pollsCategory.id);
        pc.send(split[2]);
        setTimeout(() => {
          pc.send(`@everyone ${split[1]} seconds have passed`);
        }, Number.parseInt(split[1]) * 1000);
      });
    }
  } catch (error) {
    console.error(error);
  }
});
