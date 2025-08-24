/* eslint-disable @typescript-eslint/no-require-imports */
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.commands = new Collection<string, CommandModule>();

type LoadedModule = {
  data?: { name?: string; toJSON?: () => unknown };
  execute?: (...args: unknown[]) => unknown | Promise<unknown>;
  autocomplete?: (...args: unknown[]) => unknown | Promise<unknown>;
  default?: unknown;
};

async function loadCommands() {
  const ext = isDev ? '.ts' : '.js';
  const dir = path.resolve(isDev ? 'src/commands' : 'dist/src/commands');

  for (const file of await readdir(dir)) {
    if (!file.endsWith(ext)) continue;
    const full = path.resolve(dir, file);

    let mod: LoadedModule | undefined;
    if (isDev) {
      mod = (await import(
        pathToFileURL(full).href + `?t=${Date.now()}`
      )) as unknown as LoadedModule;
    } else {
      // CJS build: require działa stabilniej na ścieżkach plikowych
      // (dynamic import bywa transpilowany do require przez TS)

      mod = require(full) as LoadedModule;
    }

    if (mod?.data?.name && typeof mod.execute === 'function') {
      client.commands.set(mod.data.name, mod as unknown as CommandModule);
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

    let mod: LoadedModule | undefined;
    if (isDev) {
      mod = (await import(
        pathToFileURL(full).href + `?t=${Date.now()}`
      )) as unknown as LoadedModule;
    } else {
      mod = require(full) as LoadedModule;
    }

    const name = (mod as Record<string, unknown>)?.['name'];
    const once = (mod as Record<string, unknown>)?.['once'];
    const execute = (mod as Record<string, unknown>)?.['execute'] as
      | ((...args: unknown[]) => unknown)
      | undefined;

    if (!name || typeof execute !== 'function') continue;

    if (once === true) client.once(String(name), (...args) => execute(...args));
    else client.on(String(name), (...args) => execute(...args));
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
