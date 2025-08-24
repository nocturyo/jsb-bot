import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type GuildConfig = {
  language: 'pl' | 'en';
  logChannelId?: string;
  ephemeralDefault?: boolean;
};

const ROOT = path.resolve('data/guilds');

async function ensureDir() {
  await mkdir(ROOT, { recursive: true });
}

function fileFor(guildId: string) {
  return path.join(ROOT, `${guildId}.json`);
}

const DEFAULTS: GuildConfig = {
  language: 'pl',
  ephemeralDefault: false,
};

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  await ensureDir();
  try {
    const buf = await readFile(fileFor(guildId), 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(buf) } as GuildConfig;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setGuildConfig(
  guildId: string,
  patch: Partial<GuildConfig>,
): Promise<GuildConfig> {
  await ensureDir();
  const current = await getGuildConfig(guildId);
  const next = { ...current, ...patch };
  await writeFile(fileFor(guildId), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}
