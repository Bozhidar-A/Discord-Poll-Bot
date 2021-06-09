const Discord = require("discord.js");
const { Client, Intents } = require("discord.js");
const fs = require("fs");
const prefix = "|poll";
require("dotenv").config();

const client = new Client();

client.commands = new Discord.Collection();

// dynamically retrieves all command files
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  client.user.setActivity("|poll | help");
  console.log("Bot is ready");
});

client.on("message", (message) => {
  // if the message doesn't start with the correct prefix ignore it
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content
    .slice(prefix.length)
    .split("|")
    .map(function (item) {
      return item.trim();
    })
    .slice(1);
  //slice(1) because js returns ["", ...].

  if (args.length === 0) {
    return message.channel.send(
      "Don't forget, each argument must be separated by |!"
    );
  }

  const commandName = args.shift().toLowerCase();

  // if no matches for command return error
  if (!client.commands.has(commandName))
    return message.channel.send(
      "No command found! Don't forget, each argument must be separated by |!"
    );

  const command = client.commands.get(commandName);
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix} | ${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  // If the user cannot mention everyone don't execute,
  // this is because the bot will message everyone afterwards
  if (command.permissions) {
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      return message.reply("Cannot mention all!");
    }
  }

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("An error accoured when trying to execute this command!");
  }
});

client.login(process.env.BOT_TOKEN);
