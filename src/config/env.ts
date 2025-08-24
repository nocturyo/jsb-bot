import 'dotenv/config';

export function getEnv() {
  const { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN) throw new Error('Brak DISCORD_TOKEN w .env');
  if (!APPLICATION_ID) throw new Error('Brak APPLICATION_ID w .env');
  return { DISCORD_TOKEN, APPLICATION_ID, GUILD_ID } as const;
}
