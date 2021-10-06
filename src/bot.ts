// Load files from the .env file
import dotenv from 'dotenv';

import { CommandoClient, SQLiteProvider, Command, CommandoMessage } from 'discord.js-commando';
import { Guild, SnowflakeUtil } from 'discord.js';
import sqlite from 'sqlite';
import path from 'path';
import { stripIndents } from 'common-tags';

import logger, { getLogTag } from './helpers/logger';
import { CMD_PREFIX, CMD_GROUPS, DISCORD_BOT_TOKEN } from './helpers/constants';

// Event handlers
import autoAuth from './eventHandlers/autoAuth';
import updateServerCountActivity from './eventHandlers/updateServerCountActivity';
import {
  updateHomepageMemberCounts,
  UPDATE_INTERVAL,
} from './eventHandlers/updateHomepageMemberCounts';
import removeGuildFromGDN from './eventHandlers/removeGuildFromGDN';

dotenv.config();

// Create the bot as a Commando client
const bot = new CommandoClient({
  commandPrefix: CMD_PREFIX,
  owner: '148474055949942787',
  invite: 'https://discord.gg/vH8uVUE',
  disabledEvents: [
    'TYPING_START',
  ],
});

// Set up a SQLite DB to preserve guide-specific command availability
sqlite.open(path.join(__dirname, '../settings.db'))
  .then(db => bot.setProvider(new SQLiteProvider(db)))
  .catch(error => { logger.error('Error loading SQLite DB:', error); });

// Initialize commands and command groups
bot.registry
  .registerDefaultTypes()
  .registerGroups([
    [CMD_GROUPS.AUTH, 'Authentication'],
    [CMD_GROUPS.GDN, 'Goon Discord Network'],
    [CMD_GROUPS.PUBLIC, 'For Everyone'],
    [CMD_GROUPS.OWNER, 'Bot Administration'],
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    unknownCommand: false,
    help: false,
    prefix: false,
  })
  // Automatically load commands that exist in the commands/ directory
  // A custom filter is specified so that the `require-all` library picks up .ts files during dev
  .registerCommandsIn({
    dirname: path.join(__dirname, 'commands'),
    filter: /^([^.].*)\.[jt]s$/,
  });

// Announce the bot's readiness to serve
bot.once('ready', () => {
  if (!bot.user) {
    logger.error('Bot initialized but has no user, how did this happen?');
    throw new Error('Bot initialized but has no user, how did this happen?');
  }

  /* eslint-disable no-useless-escape */
  logger.info(stripIndents`
       __________  _   ______        __
      / ____/ __ \/ | / / __ )____  / /_
     / / __/ / / /  |/ / __  / __ \/ __/
    / /_/ / /_/ / /|  / /_/ / /_/ / /_
    \____/_____/_/ |_/_____/\____/\__/
  `);
  logger.info(`Logged in as ${bot.user.tag}`);
  logger.info(`Command prefix: ${bot.commandPrefix}`);
  logger.info('---:getin:---');
  /* eslint-enable no-useless-escape */

  bot.user.setActivity('in the forge');

  const tag = getLogTag('botinit');

  // Update bot activity to reflect number of guilds
  updateServerCountActivity(tag, bot);
  // Update homepage server counts on boot
  updateHomepageMemberCounts(bot);
});

// Handle errors
bot.on('error', (err) => {
  if (err.message === 'Cannot read property \'trim\' of undefined') {
    // Swallow a bug in discord.js-commando at:
    // node_modules/discord.js-commando/src/extensions/message.js:109:28
  } else {
    logger.error(err, 'Bot system error');
  }
});

/**
 * Event Handlers
 */

// When the bot joins a Guild
bot.on('guildCreate', (guild: Guild) => {
  const tag = getLogTag(SnowflakeUtil.generate());

  logger.info(`Joined guild ${guild.name} (${guild.id})`);
  updateServerCountActivity(tag, bot);
});

// When the bot leaves a Guild
bot.on('guildDelete', (guild: Guild) => {
  const tag = getLogTag(SnowflakeUtil.generate());

  logger.info(tag, `Left guild ${guild.name} (${guild.id})`);

  updateServerCountActivity(tag, bot);
  removeGuildFromGDN(tag, guild);
});

// When a Member joins a Guild
bot.on('guildMemberAdd', autoAuth);

bot.on('commandError', (command: Command, err: Error, message: CommandoMessage) => {
  message.channel.stopTyping();
});

// Update server member counts on the GDN Homepage
bot.setInterval(
  () => {
    updateHomepageMemberCounts(bot);
  },
  UPDATE_INTERVAL,
);

// Start the bot
bot.login(DISCORD_BOT_TOKEN);
