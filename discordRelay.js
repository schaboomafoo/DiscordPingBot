const { Client, GatewayIntentBits } = require('discord.js');

let client;

/**
 * Starts the Discord client (relay bot)
 */
function startDiscordRelay() {
  client = new Client({
    intents: [GatewayIntentBits.Guilds] // only need Guilds intent to send DMs
  });

  client.once('ready', () => {
    console.log(`Discord relay ready as ${client.user.tag}`);
  });

  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Failed to login Discord bot:', err.message);
  });
}

/**
 * Sends a DM to a Discord user
 * @param {Object} options
 * @param {string} options.discordUserId - Discord user ID to send message to
 * @param {string} options.twitchUser - Twitch username who triggered the ping
 * @param {string} options.channel - Twitch channel name
 * @param {string} options.ping - Ping word/phrase that triggered
 * @param {string} options.message - Full Twitch message that triggered
 */
async function sendDiscordNotification({ discordUserId, twitchUser, channel, ping, message }) {
  if (!client) {
    console.error('Discord client is not initialized!');
    return;
  }

  try {
    const user = await client.users.fetch(discordUserId);
    await user.send(`"${ping}" was mentioned in ${channel} \n${twitchUser}: "${message}"`);
    console.log(`Sent Discord DM to ${discordUserId}: "${ping}" triggered in #${channel}"`);
  } catch (err) {
    console.error(`Failed to send DM to ${discordUserId}:`, err.message);
  }
}

module.exports = { startDiscordRelay, sendDiscordNotification };