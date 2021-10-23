const fetch = require("node-fetch");
const stream = require("stream");
const Discord = require("discord.js");

function PollsCategoryGetter(msg) {
  return msg.channel.guild.channels.cache.find(
    (channel) => channel.name === "Polls"
  );
}

function GetMax(object) {
  return Object.keys(object).filter((x) => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
}

module.exports = {
  name: "new",
  args: true,
  usage:
    "| {poll duration in seconds} | {poll question} | {first emoji - answer}... | {last emoji - answer}",
  description: "New poll command",
  execute(message, args, botUser) {
    // When someone uses the bot I'll see what they did for easier debugging
    console.log(
      `${message.author.tag} used the bot.\nDate: ${message.createdAt}.\nMessage: ${message.content}\n---------------`
    );

    if (
      !message.member.hasPermission("MENTION_EVERYONE") ||
      !message.member.hasPermission("ADMINISTRATOR")
    ) {
      return message.channel.send(
        `You cannot use \$${this.name} here because you are lacking the permission to do so. ${message.author}`
      );
    }

    if (isNaN(args[0])) {
      return message.channel.send(
        `The first argument MUST be the duration of the poll. ${message.author}`
      );
    }

    if (args.length < 4) {
      return message.channel.send(
        `You must provide at least 4 arguments. Please see |poll | help ${message.author}`
      );
    }

    var pollsCategory = PollsCategoryGetter(message);
    //gets polls category
    //if not found pollsCategory will be undefined

    if (pollsCategory === undefined) {
      message.guild.channels
        .create("Polls", {
          type: "category",
        })
        .then((pc) => {
          pollsCategory = pc;
        });
    } //polls category doesn't exist. Create it

    //state of the poll
    var emojiChoiceDict = {};
    var choices = " \n";

    var options = args.slice(2);
    for (var i = 0; i < options.length; i++) {
      var temp = options[i].split("-").map(function (item) {
        return item.trim();
      });

      if (temp[0] in emojiChoiceDict) {
        return message.channel.send(
          `Please don't provide the same emoji twice. ${message.author}`
        );
      } else {
        emojiChoiceDict[temp[0]] = 0;

        choices += options[i] + " \n";
      }
    }

    //create new channel
    message.guild.channels.create(args[1], { type: "text" }).then((pch) => {
      pch.setParent(pollsCategory.id);
      //put the channel in the category

      pch.send(args[1] + choices).then((pollMsg) => {
        //self react
        let pollOptionEmojis = Object.keys(emojiChoiceDict);

        pollOptionEmojis.forEach((emoji) => {
          pollMsg.react(emoji).catch((e) => {
            console.log("ERROR");
            console.log(e);
            pch.delete();
            return message.channel.send(
              `One or many poll options were malformed. Stopping poll. ${message.author} Please see |poll | help`
            );
          });
        });

        pch.send(`This poll will end in ${Number.parseInt(args[0])} seconds.`);
        pch.send("@everyone");

        //setting up collector and filter
        const filter = (reaction, user) => {
          console.log(user.id);
          console.log(user.tag);
          console.log(reaction.emoji.name);
          console.log(reaction.emoji.id);

          return (
            //check if its a normal emoji or a custom emoji and that the bot didn't react
            (reaction.emoji.name in emojiChoiceDict ||
              `<:${reaction.emoji.name}:${reaction.emoji.id}>` in
                emojiChoiceDict) &&
            user.id !== botUser.user.id
          );
        };

        const collector = pollMsg.createReactionCollector(filter, {
          time: Number.parseInt(args[0]) * 1000,
          dispose: true,
        });

        collector.on("collect", (reaction, user) => {
          console.log("added react");
          emojiChoiceDict[reaction.emoji] += 1;
        });

        collector.on("remove", (reaction, user) => {
          console.log("removed react");
          emojiChoiceDict[reaction.emoji] -= 1;
        });

        collector.on("end", () => {
          pch.send(
            "@everyone \nThe poll has concluded and the results are in!"
          );
          if (!Object.entries(emojiChoiceDict).some(([k, v]) => v > 0)) {
            //no one voted
            pch.send("No one appears to have voted...");
            return;
          }
          let res = GetMax(emojiChoiceDict);
          if (res.length === 1) {
            //one result, just post it
            pch.send(
              `It appears the winner is ${res} with ${emojiChoiceDict[res]} vote(s)!`
            );
          } else {
            //some kind of tie
            pch.send(
              `It appears there are multiple winners and they are ${res.map(
                (item) => {
                  return item + ", ";
                }
              )}`
            );
          }
        });
      });
    });
  },
};
