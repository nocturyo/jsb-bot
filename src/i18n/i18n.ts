import { getGuildConfig } from '../config/guildConfig';

type Dict = Record<string, string>;

const pl: Dict = {
  'ping.pong': 'Pong! Opóźnienie: {ms} ms',
  'info.msg': 'Cześć **{user}**! Jesteś na: **{guild}**.',
  'error.generic': 'Wystąpił błąd podczas wykonywania komendy.',
};

const en: Dict = {
  'ping.pong': 'Pong! Latency: {ms} ms',
  'info.msg': 'Hi **{user}**! You are on: **{guild}**.',
  'error.generic': 'An error occurred while executing the command.',
};

const bundles: Record<'pl' | 'en', Dict> = { pl, en };

function format(str: string, vars: Record<string, string | number> = {}) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), str);
}

/** Zwraca funkcję t(key, vars) zależną od języka gildii (domyślnie PL). */
export async function getT(guildId?: string) {
  let lang: 'pl' | 'en' = 'pl';
  if (guildId) {
    const cfg = await getGuildConfig(guildId);
    lang = cfg.language ?? 'pl';
  }
  const dict = bundles[lang] ?? pl;
  return (key: string, vars?: Record<string, string | number>) => format(dict[key] ?? key, vars);
}
