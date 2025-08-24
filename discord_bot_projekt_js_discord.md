# Struktura projektu (TypeScript)

```
discord-bot/
├─ package.json
├─ tsconfig.json
├─ README.md
├─ .gitignore
├─ .env               # NIE wrzucamy do repo (użyj .env.example jako wzoru)
├─ .env.example
├─ scripts/
│  └─ register-commands.ts
└─ src/
   ├─ index.ts
   ├─ config/
   │  └─ env.ts
   ├─ commands/
   │  ├─ ping.ts
   │  └─ info.ts
   ├─ events/
   │  ├─ ready.ts
   │  └─ interactionCreate.ts
   └─ utils/
      └─ logger.ts
```

---

## Dlaczego TypeScript?

- **Typy = mniej błędów** (szczególnie przy pracy z `interaction`, `client`, itp.).
- **Lepsze podpowiedzi w edytorze** i pewność, że API `discord.js` używasz poprawnie.
- **Skalowalność** – łatwiej utrzymać większy projekt.

---

## Instrukcja szybkiego startu (TS)

1. **Wymagania:** Node.js ≥ 18.
2. **Zainstaluj zależności:**

```bash
npm install
```

3. **Utwórz `.env`** na podstawie `.env.example` i wklej wartości:

```
DISCORD_TOKEN=twój_token_bota
APPLICATION_ID=twoje_application_id
GUILD_ID=id_serwera_do_dev (opcjonalne)
```

4. **Dev (bez kompilacji, na żywo):**

```bash
npm run dev
```

5. **Rejestracja komend w DEV:**

```bash
npm run dev:register
```

6. **Build + start (prod):**

```bash
npm run build
npm start
```

7. **Rejestracja komend w PROD (globalnie lub bez GUILD_ID):**

```bash
npm run register:commands
```

> Uwaga: podczas dev używaj `GUILD_ID` – komendy pojawiają się od razu. Globalne komendy mogą propagować się dłużej.

---

## Pliki

### `package.json`

```json
{
  "name": "discord-bot-pro",
  "version": "0.2.0",
  "main": "dist/src/index.js",
  "scripts": {
    "build": "tsc -p .",
    "start": "node dist/src/index.js",
    "register:commands": "node dist/scripts/register-commands.js",
    "dev": "tsx watch src/index.ts",
    "dev:register": "tsx watch scripts/register-commands.ts"
  },
  "engines": { "node": ">=18.0.0" },
  "dependencies": {
    "discord.js": "^14.16.3",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["src", "scripts"],
  "exclude": ["node_modules"]
}
```

### `.gitignore`

```gitignore
node_modules
.env
.DS_Store
dist
```

### `.env.example`

```env
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
GUILD_ID=your_guild_id_for_dev_here
```

### `README.md`

```md
# Discord Bot – szkielet (TypeScript + discord.js v14)

## Szybki start

1. `npm install`
2. Skopiuj `.env.example` do `.env` i uzupełnij.
3. DEV: `npm run dev` (bot) i w drugim terminalu `npm run dev:register` (komendy).
4. PROD: `npm run build && npm start` oraz `npm run register:commands` dla komend globalnych.

### Notatki

- Podczas dev trzymaj `GUILD_ID` w `.env`.
- Do publikacji globalnej usuń `GUILD_ID` i ponownie zarejestruj komendy.
```

---

### `scripts/register-commands.ts`

```ts
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadSlashCommandData(commandsDir: string) {
  const commands: any[] = [];
  for (const file of await readdir(commandsDir)) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
    const modUrl = pathToFileURL(path.join(commandsDir, file)).href;
    const mod: any = await import(modUrl as unknown as string);
    if (mod?.data && typeof mod.data.toJSON === 'function') {
      commands.push(mod.data.toJSON());
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

  // W DEV (tsx) ładujemy z src/, w PROD z dist/src/
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
```

---

### `src/config/env.ts`

```ts
import 'dotenv/config';

export function getEnv() {
  const { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN) throw new Error('Brak DISCORD_TOKEN w .env');
  if (!APPLICATION_ID) throw new Error('Brak APPLICATION_ID w .env');
  return { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } as const;
}
```

### `src/utils/logger.ts`

```ts
export const logger = {
  info: (...args: any[]) => console.log('[INFO]', new Date().toISOString(), ...args),
  warn: (...args: any[]) => console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args: any[]) => console.error('[ERROR]', new Date().toISOString(), ...args),
};
```

### `src/commands/ping.ts`

```ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Sprawdź czas reakcji bota');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const diff = sent.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(`Pong! Opóźnienie: ${diff} ms`);
}
```

### `src/commands/info.ts`

```ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Podstawowe informacje o bocie i serwerze');

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user.tag;
  const guild = interaction.guild?.name ?? 'DM';
  await interaction.reply({
    content: `Cześć **${user}**! Jesteś na: **${guild}**.`,
    ephemeral: true,
  });
}
```

### `src/events/ready.ts`

```ts
import { Client } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'ready';
export const once = true;
export function execute(client: Client) {
  if (!client.user) return;
  logger.info(`Zalogowano jako ${client.user.tag}`);
}
```

### `src/events/interactionCreate.ts`

```ts
import { Interaction } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands?.get(interaction.commandName) as any;
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('Błąd w komendzie', interaction.commandName, err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          ephemeral: true,
        });
      }
    } catch {}
  }
}
```

### `src/index.ts`

```ts
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getEnv } from './config/env';
import { logger } from './utils/logger';

const { DISCORD_TOKEN } = getEnv();

// Rozszerzamy typ klienta o mapę komend
interface CommandModule {
  data: { name: string };
  execute: Function;
}

declare module 'discord.js' {
  interface Client {
    commands?: Collection<string, CommandModule>;
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection<string, CommandModule>();

async function loadCommands() {
  const dir = path.resolve('./src/commands');
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
    const mod = (await import(pathToFileURL(path.join(dir, file)).href)) as any;
    if (mod?.data?.name && typeof mod.execute === 'function') {
      client.commands.set(mod.data.name, mod as CommandModule);
    }
  }
  logger.info(`Załadowano komend: ${client.commands.size}`);
}

async function loadEvents() {
  const dir = path.resolve('./src/events');
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
    const { name, once, execute } = (await import(pathToFileURL(path.join(dir, file)).href)) as any;
    if (!name || !execute) continue;
    if (once) client.once(name, (...args) => execute(...args));
    else client.on(name, (...args) => execute(...args));
  }
}

async function main() {
  await loadCommands();
  await loadEvents();
  await client.login(DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error('Błąd startu aplikacji:', err);
  process.exit(1);
});
```

---

## Roadmap (będziemy aktualizować)

- [ ] Konfiguracja per-gildia (SQLite/Prisma lub JSON na start)
- [ ] Komendy z opcjami i autouzupełnianiem
- [ ] Logger do plików (pino/winston) i centralny error handler
- [ ] Testy jednostkowe (vitest) dla komend
- [ ] Dockerfile / deployment (Render/Fly.io)

```

```
