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
      !message.member.permissions.has("MENTION_EVERYONE") ||
      !message.member.permissions.has("ADMINISTRATOR")
    ) {
      return message.channel.send({
        content: `You cannot use \$${this.name} here because you are lacking the permission to do so. ${message.author}`,
      });
    }

    if (isNaN(args[0])) {
      return message.channel.send({
        content: `The first argument MUST be the duration of the poll. ${message.author}`,
      });
    }

    if (args.length < 4) {
      return message.channel.send({
        content: `You must provide at least 4 arguments. Please see |poll | help ${message.author}`,
      });
    }

    var pollsCategory = PollsCategoryGetter(message);
    //gets polls category
    //if not found pollsCategory will be undefined

    if (pollsCategory === undefined) {
      message.guild.channels
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

    //state of the poll
    var emojiChoiceDict = {};
    var choices = " \n";

    var options = args.slice(2);
    for (var i = 0; i < options.length; i++) {
      var temp = options[i].split("-").map(function (item) {
        return item.trim();
      });

      if (temp[0] in emojiChoiceDict) {
        return message.channel.send({
          content: `Please don't provide the same emoji twice. ${message.author}`,
        });
      } else {
        emojiChoiceDict[temp[0]] = 0;

        choices += options[i] + " \n";
      }
    }

    //create new channel
    message.guild.channels
      .create(args[1], {
        type: "text",
        permissionOverwrites: [
          {
            id: message.guild.roles.everyone.id,
            deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
          },
        ],
      })
      .then((pch) => {
        pch.setParent(pollsCategory.id);
        //put the channel in the category

        pch.send({ content: `${args[1] + choices}` }).then((pollMsg) => {
          //setting up collector and filter
          const filter = (reaction, user) => {
            console.log(
              `${user.tag}(${user.id}) added ${reaction.emoji.name} (id - ${reaction.emoji.id})`
            );

            return (
              //check if its a normal emoji or a custom emoji and that the bot didn't react
              (reaction.emoji.name in emojiChoiceDict ||
                `<:${reaction.emoji.name}:${reaction.emoji.id}>` in
                  emojiChoiceDict) &&
              user.id !== botUser.user.id
            );
          };

          const collector = pollMsg.createReactionCollector({
            filter,
            time: Number.parseInt(args[0]) * 1000,
            dispose: true,
          });

          //self react
          let pollOptionEmojis = Object.keys(emojiChoiceDict);

          pollOptionEmojis.forEach((emoji) => {
            pollMsg.react(emoji).catch((e) => {
              console.log("ERROR");
              console.log(e);
              pch.delete();
              collector.stop("ERROR");
              return message.channel.send({
                content: `One or many poll options were malformed. Stopping poll. ${message.author} Please see |poll | help`,
              });
            });
          });

          pch.send({
            content: `This poll will end in ${Number.parseInt(
              args[0]
            )} seconds.`,
          });
          pch.send({ content: "@everyone" });

          collector.on("collect", (reaction, user) => {
            emojiChoiceDict[reaction.emoji] += 1;

            console.log(
              `${user.tag} (${user.id}) added react ${
                reaction.emoji
              }.\nState of poll - ${JSON.stringify(emojiChoiceDict)}`
            );
          });

          collector.on("remove", (reaction, user) => {
            emojiChoiceDict[reaction.emoji] -= 1;

            console.log(
              `${user.tag} (${user.id}) removed react ${
                reaction.emoji
              }.\nState of poll - ${JSON.stringify(emojiChoiceDict)}`
            );
          });

          collector.on("end", (collected, reason) => {
            if (reason === "ERROR") {
              return;
            }

            pch.send({
              content:
                "@everyone \nThe poll has concluded and the results are in!",
            });

            if (!Object.entries(emojiChoiceDict).some(([k, v]) => v > 0)) {
              //no one voted
              pch.send({ content: "No one appears to have voted..." });

              return;
            }
            let res = GetMax(emojiChoiceDict);
            if (res.length === 1) {
              //one result, just post it
              pch.send({
                content: `It appears the winner is ${res} with ${emojiChoiceDict[res]} vote(s)!`,
              });
            } else {
              //some kind of tie
              pch.send({
                content: `It appears there are multiple winners and they are ${res.map(
                  (item) => {
                    return item + ", ";
                  }
                )}`,
              });
            }
          });
        });
      });
  },
};
