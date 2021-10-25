const Discord = require("discord.js");
const { Client, Intents } = require("discord.js");
const fs = require("fs");
const prefix = "|poll";
require("dotenv").config();

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS);
myIntents.add(Intents.FLAGS.GUILD_MESSAGES);
myIntents.add(Intents.FLAGS.GUILD_MESSAGE_REACTIONS);

const client = new Client({
  intents: myIntents,
});

client.login(process.env.BOT_TOKEN);

var botUser = null; //var to store client.user

client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();

// dynamically retrieves all command files
const commands = [];
const slashCommands = [];

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (!command.name) return;

  commands.push(command);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

const slashCommandFiles = fs
  .readdirSync("./commands/slash")
  .filter((file) => file.endsWith(".js"));

for (const file of slashCommandFiles) {
  const command = require(`./commands/slash/${file}`);

  if (!command.name) return;

  slashCommands.push(command);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.slashCommands.set(command.name, command);
}

client.once("ready", async () => {
  client.user.setActivity("|poll | help");
  botUser = client;
  console.log("Bot is ready");

  const testGuild = process.env.testGuild;
  // const clientID = client.user.id;

  await client.guilds.cache
    .get(testGuild)
    .commands.set(slashCommands)
    .then(() => console.log("slash for debug ready"));

  // Register for all the guilds the bot is in
  // await client.application.commands.set(arrayOfSlashCommands);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.run(client, interaction, interaction.options);
  } catch (error) {
    if (error) console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("messageCreate", (message) => {
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
    command.execute(message, args, botUser);
  } catch (error) {
    console.error(error);
    message.reply("An error accoured when trying to execute this command!");
  }
});
