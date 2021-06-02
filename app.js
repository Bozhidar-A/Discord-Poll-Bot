const Discord = require("discord.js");
require("dotenv").config();

const client = new Discord.Client();

client.on("ready", () => {
  console.log("Bot is ready");
});

client.login(process.env.BOT_TOKEN);

function GetMax(object) {
  return Object.keys(object).filter((x) => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
}

// const helpEmbed = new Discord.MessageEmbed()
//   .setTitle("Syntax:")
//   .setDescription(
//     "All arguments are prefixed with '-'. Example: !poll - {poll-duration-in-seconds} - {poll-question} - {first-poll-option}... - {last-poll-option}"
//   );
const helpText =
  "**Syntax:** \nAll arguments are prefixed with '&$&'. \n**Example:** \n!poll &$& {poll-duration-in-seconds} &$& {poll-question} &$& {emoji} - {first-poll-option}... &$& {emoji} - {last-poll-option} \n**Example:** \nHow was your day? \n1. Good \n2. Bad \n";

client.on("message", (msg) => {
  if (msg.content === "!poll help") {
    msg.channel.send(helpText);
    return;
  }
  try {
    let split = msg.content.split("&$&").map(function (item) {
      return item.trim();
    }); //this is bad

    if (split[0] !== "!poll") {
      return;
    } else if (split[1] === "help") {
      msg.channel.send(helpText);
    } else {
      let pollsCategory = null;
      // let pollChannel = null;

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
          (channel) => channel.name === "Polls" //make a refernece
        );
      }

      msg.guild.channels.create(split[2], { type: "text" }).then((pc) => {
        var emojiChoiceDict = {};
        let choices =
          " \n" +
          split
            .slice(3)
            .map(function (item) {
              var temp = item.split("-").map(function (item) {
                return item.trim();
              });
              emojiChoiceDict[temp[0]] = 0;
              //making dict for checking the results

              return item + " \n";
            })
            .join("");
        //gets all choices and adds  \n so they can be in one message with the question and look nice

        pc.setParent(pollsCategory.id);
        //put the channel in the category

        //send poll
        pc.send("@everyone \n" + split[2] + choices).then((pollMsg) => {
          const filter = (reaction, user) => {
            console.log(user.id);
            console.log(user.tag);
            console.log(reaction.emoji.name);

            return reaction.emoji.name in emojiChoiceDict;
            // return reaction.emoji.name === "🐒";
          };

          const collector = pollMsg.createReactionCollector(filter, {
            time: Number.parseInt(split[1]) * 1000,
          });

          collector.on("collect", (reaction, user) => {
            emojiChoiceDict[reaction.emoji] += 1;
          });

          collector.on("end", (collected) => {
            pc.send(
              "@everyone \nThe poll has concluded and the results are in!"
            );
            let res = GetMax(emojiChoiceDict);
            if (res.length === 1) {
              //one result, just post it
              pc.send(
                `It appears the winner is ${res} -  with ${emojiChoiceDict[res]} vote(s)!`
              );
            } else {
              //some kind of tie
              pc.send(
                `It appears there are multiple winners and they are ${res.map(
                  (item) => {
                    return item + "\n";
                  }
                )}`
              );
            }
          });
        });

        // setTimeout(() => {
        //   pc.send(`@everyone ${split[1]} seconds have passed`);
        // }, Number.parseInt(split[1]) * 1000); //wait seconds and post results
      });
    }
  } catch (error) {
    msg.channel.send("An error has occured. Try again.");
    console.error(error);
  }
});
