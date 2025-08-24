import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getEnv } from './config/env';
import { logger } from './utils/logger';

const { DISCORD_TOKEN } = getEnv();
const isDev = process.env.NODE_ENV !== 'production';

// dodatkowe logowanie problemów poza try/catch
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection<string, CommandModule>();

async function loadCommands() {
  const ext = isDev ? '.ts' : '.js';
  const dir = path.resolve(isDev ? 'src/commands' : 'dist/src/commands');

  for (const file of await readdir(dir)) {
    if (!file.endsWith(ext)) continue;
    const full = path.resolve(dir, file);

    let mod: any;
    if (isDev) {
      mod = await import(pathToFileURL(full).href + `?t=${Date.now()}`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      mod = require(full);
    }

    if (mod?.data?.name && typeof mod.execute === 'function') {
      client.commands.set(mod.data.name, mod as CommandModule);
    }
  }
  logger.info(`Załadowano komend: ${client.commands.size}`);
}

async function loadEvents() {
  const ext = isDev ? '.ts' : '.js';
  const dir = path.resolve(isDev ? 'src/events' : 'dist/src/events');

  for (const file of await readdir(dir)) {
    if (!file.endsWith(ext)) continue;
    const full = path.resolve(dir, file);

    let mod: any;
    if (isDev) {
      mod = await import(pathToFileURL(full).href + `?t=${Date.now()}`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      mod = require(full);
    }

    const { name, once, execute } = mod ?? {};
    if (!name || !execute) continue;
    if (once) client.once(name, (...args) => execute(...args));
    else client.on(name, (...args) => execute(...args));
  }
}

async function main() {
  await loadCommands();
  await loadEvents();
  logger.info('Próba logowania bota...');
  await client.login(DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error('Błąd startu aplikacji:', err);
  process.exit(1);
});
