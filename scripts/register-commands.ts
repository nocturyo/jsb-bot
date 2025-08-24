import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadSlashCommandData(commandsDir: string) {
  const commands: any[] = [];
  const isTs = __filename.endsWith('.ts');
  const ext = isTs ? '.ts' : '.js';

  for (const file of await readdir(commandsDir)) {
  if (!file.endsWith(ext)) continue;

  const full = path.resolve(commandsDir, file);
  let mod: any;

  if (isTs) {
    mod = await import(pathToFileURL(full).href + `?t=${Date.now()}`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require(full);
  }

  if (mod?.data && typeof mod.data.toJSON === 'function') {
    console.log(`→ OK: ${file} → /${mod.data.name}`);
    commands.push(mod.data.toJSON());
  } else {
    console.warn(`→ POMINIĘTO: ${file} (brak exportów data/execute?)`);
  }
}
  return commands;
}

async function register() {
  const { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !APPLICATION_ID) {
    console.error('Brak DISCORD_TOKEN lub APPLICATION_ID w .env');
    process.exit(1);
  }

  const rest = new REST().setToken(DISCORD_TOKEN);

  // DEV → src/commands ; PROD → dist/src/commands
  const isTs = __filename.endsWith('.ts');
  const commandsDir = path.resolve(isTs ? 'src/commands' : 'dist/src/commands');
  const body = await loadSlashCommandData(commandsDir);

  try {
    console.log(`Rejestruję ${body.length} komend...`);
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID)
      : Routes.applicationCommands(APPLICATION_ID);

    await rest.put(route, { body });
    console.log('✅ Komendy zarejestrowane.');
  } catch (err) {
    console.error('❌ Błąd rejestracji komend:', err);
    process.exit(1);
  }
}

register();
