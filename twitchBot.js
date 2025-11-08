const tmi = require('tmi.js');
const fs = require('fs');
const { sendDiscordNotification } = require('./discordRelay');

let users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

function saveUsers() {
  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
}

function startTwitchBot() {
  const client = new tmi.Client({
    options: { debug: true },
    connection: { reconnect: true },
    identity: {
      username: process.env.TWITCH_USERNAME,
      password: process.env.TWITCH_TOKEN
    },
    channels: Object.values(users).flatMap(u => u.channels)
  });

  client.connect();

  // handle messages
  client.on('message', (channel, userstate, message, self) => {
    if (self) return;
    const username = userstate['display-name'].toLowerCase();

    // Commands
    if (message.startsWith('**addping')) {
      const ping = message.split(' ').slice(1).join(' ').trim();


      if (!users[username]) {
        users[username] = { pings: [], channels: [], discordId: null };
        saveUsers();
      }
    
      // Check registration
      if (!users[username].discordId) {
        return client.say(
          channel,
          `@${username}, you are not registered! Use the command !register (your Discord username or ID) to register. ` +
          `Make sure your Discord allows DMs from strangers or that you’ve joined https://discord.gg/z38xzErf`
        );
      }

      if (!ping)
        return client.say(channel, `@${username}, usage: !addping [word/phrase]`);

      users[username].pings.push(ping);
      saveUsers();
    
      return client.say(channel, `@${username}, added ping: "${ping}"`);
    }






    // Ping detection
    for (const [user, data] of Object.entries(users)) {
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

module.exports = { startTwitchBot };
