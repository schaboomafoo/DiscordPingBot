require('dotenv').config();
const startDiscordBot = require('./discordBot');
const startTwitchBot = require('./twitchBot');

startDiscordBot();
startTwitchBot();