require('dotenv').config();

//Twitch bot handles all commands and ping detection
const { startTwitchBot } = require('./twitchBot');
const { startDiscordRelay } = require('./discordRelay');

startDiscordRelay();
startTwitchBot();