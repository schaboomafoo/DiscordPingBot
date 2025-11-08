const tmi = require('tmi.js');
const fs = require('fs');
const {
	sendDiscordNotification
} = require('./discordRelay');
const {
	loadUsers, saveUsers
} = require('./utils/dataHandler');
const MAIN_CHANNEL = process.env.TWITCH_CHANNEL.toLowerCase();

let users = loadUsers();

function startTwitchBot() {
	const client = new tmi.Client({
		options: {
			debug: true
		},
		connection: {
			reconnect: true
		},
		identity: {
			username: process.env.TWITCH_USERNAME,
			password: process.env.TWITCH_TOKEN
		},
		channels: [MAIN_CHANNEL, ...Object.values(users).flatMap(u => u.channels)]
	});

	client.connect();



	// handle messages
	client.on('message', (channel, userstate, message, self) => {
		if (self) return;
		const username = userstate.username;


		if (channel.replace('#','').toLowerCase() === MAIN_CHANNEL) {		
			//COMMANDS
			//**register
			if (message.startsWith('**register')) {

				const discordIdOrName = message.split(' ')[1];

				if (!discordIdOrName) {
					return client.say(MAIN_CHANNEL, `@${username}, usage: **register [Discord ID]`);
				}

				if (!users[username]) {
					users[username] = {
						pings: [],
						channels: [],
						discordId: null
					};
				}

				users[username].discordId = discordIdOrName;
				saveUsers(users);

				client.say(MAIN_CHANNEL, `@${username}, you’ve been registered with Discord ID: ${discordIdOrName}`);
			}

			//**addping
			if (message.startsWith('**addping')) {
				const ping = message.split(' ').slice(1).join(' ').trim();


				if (!users[username]) {
					users[username] = {
						pings: [],
						channels: [],
						discordId: null
					};
					saveUsers(users);
				}

				// Check registration
				if (!users[username].discordId) {
					return client.say(
						MAIN_CHANNEL,
						`@${username}, you are not registered! Use the command **register (your Discord username or ID) to register. ` +
						`Make sure your Discord allows DMs from strangers or that you’ve joined https://discord.gg/z38xzErf`
					);
				}

				if (!ping)
					return client.say(MAIN_CHANNEL, `@${username}, usage: **addping [word/phrase]`);

				users[username].pings.push(ping);
				saveUsers(users);

				return client.say(MAIN_CHANNEL, `@${username}, added ping: "${ping}"`);
			}

			//**addchannel
			if (message.startsWith('**addchannel')) {
				const newChannel = message.split(' ')[1]?.toLowerCase(); // get the first argument
				const username = userstate.username;

				// Check registration
				if (!users[username]?.discordId) {
					return client.say(
						MAIN_CHANNEL,
						`@${username}, you are not registered! Use **register (your Discord username or ID) to register. ` +
						`Make sure your Discord allows DMs from strangers or that you’ve joined https://discord.gg/z38xzErf`
					);
				}

				// Validate channel argument
				if (!newChannel) {
					return client.say(MAIN_CHANNEL, `@${username}, usage: **addchannel [twitch_channel_name]`);
				}

				// Ensure user exists in database
				if (!users[username]) {
					users[username] = {
						pings: [],
						channels: [],
						discordId: null
					};
				}

				// Check if channel is already added
				if (users[username].channels.includes(newChannel)) {
					return client.say(MAIN_CHANNEL, `@${username}, the channel "${newChannel}" is already in your watchlist.`);
				}

				// Add the channel
				users[username].channels.push(newChannel);
				saveUsers(users); // make sure you have a function that writes users.json

				// Let user know
				return client.say(MAIN_CHANNEL, `@${username}, added channel "${newChannel}" to your watchlist!`);
				
				client.join(newChannel)
  				.then(() => client.say(MAIN_CHANNEL, `@${username}, now listening to ${newChannel}!`))
  				.catch(err => console.error(`Failed to join ${newChannel}:`, err));
			}
		}



		// Ping detection
		for (const [user, data] of Object.entries(users)) {
			if (!data.channels.includes(channel.replace('#', '').toLowerCase())) continue; // only check if channel is in user's list
		
			for (const ping of data.pings) {
				if (message.toLowerCase().includes(ping.toLowerCase())) {
					sendDiscordNotification({
						discordUserId: data.discordId,
						twitchUser: username,
						channel,
						ping,
						message
					});
				}
			}
		}
	});
}

module.exports = {
	startTwitchBot
};