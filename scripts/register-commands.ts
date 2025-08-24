/* eslint-disable @typescript-eslint/no-require-imports */
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getEnv } from '../src/config/env';
import { logger } from '../src/utils/logger';

const { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } = getEnv();
const isDev = process.env.NODE_ENV !== 'production';

type LoadedModule = {
  data?: SlashCommandBuilder;
  execute?: (...args: unknown[]) => unknown;
  autocomplete?: (...args: unknown[]) => unknown;
  default?: unknown;
};

async function loadSlashCommandData() {
  const ext = isDev ? '.ts' : '.js';
  const dir = path.resolve(isDev ? 'src/commands' : 'dist/src/commands');

  const commands: unknown[] = [];

  for (const file of await readdir(dir)) {
    if (!file.endsWith(ext)) continue;
    const full = path.resolve(dir, file);

    let mod: LoadedModule | undefined;
    if (isDev) {
      mod = (await import(pathToFileURL(full).href)) as unknown as LoadedModule;
    } else {
      mod = require(full) as LoadedModule;
    }

    if (mod?.data && typeof mod.data.name === 'string') {
      commands.push(mod.data.toJSON());
    }
  }

  return commands;
}

async function register() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  const commands = await loadSlashCommandData();

  try {
    logger.info(`Rejestruję ${commands.length} komend...`);

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), {
        body: commands,
      });
      logger.info('Komendy zarejestrowane (GUILD).');
    } else {
      await rest.put(Routes.applicationCommands(APPLICATION_ID), {
        body: commands,
      });
      logger.info('Komendy zarejestrowane (GLOBAL).');
    }
  } catch (err) {
    logger.error('Błąd podczas rejestracji komend', err);
  }
}

register();
