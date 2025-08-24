import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const isDev = process.env.NODE_ENV !== 'production';

// --- pobranie env + walidacja ---
if (!process.env.DISCORD_TOKEN) {
  console.error('Brak DISCORD_TOKEN w zmiennych środowiskowych.');
  process.exit(1);
}
if (!process.env.APPLICATION_ID) {
  console.error('Brak APPLICATION_ID w zmiennych środowiskowych.');
  process.exit(1);
}

// po walidacji rzutujemy – już wiemy, że to string
const TOKEN = process.env.DISCORD_TOKEN as string;
const APP_ID = process.env.APPLICATION_ID as string;
const GUILD_ID = process.env.GUILD_ID as string | undefined;

type LoadedModule = {
  data?: SlashCommandBuilder;
  execute?: (...args: unknown[]) => unknown | Promise<unknown>;
  autocomplete?: (...args: unknown[]) => unknown | Promise<unknown>;
};

async function loadSlashCommandData(): Promise<unknown[]> {
  const ext = isDev ? '.ts' : '.js';
  const dir = path.resolve(isDev ? 'src/commands' : 'dist/src/commands');

  const out: unknown[] = [];

  for (const file of await readdir(dir)) {
    if (!file.endsWith(ext)) continue;

    const full = path.resolve(dir, file);
    const href = pathToFileURL(full).href + (isDev ? `?t=${Date.now()}` : '');

    const mod = (await import(href)) as unknown as LoadedModule;

    if (mod?.data && typeof mod.data.toJSON === 'function') {
      out.push(mod.data.toJSON());
    }
  }

  return out;
}

async function register() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  const body = await loadSlashCommandData();
  console.log(`Rejestruję ${body.length} komend...`);

  const route = GUILD_ID
    ? Routes.applicationGuildCommands(APP_ID, GUILD_ID)
    : Routes.applicationCommands(APP_ID);

  await rest.put(route, { body });
  console.log(
    GUILD_ID ? '✅ Komendy zarejestrowane (GUILD).' : '✅ Komendy zarejestrowane (GLOBAL).',
  );
}

register().catch((err) => {
  console.error('❌ Błąd rejestracji komend:', err);
  process.exit(1);
});
