import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { getGuildConfig } from '../config/guildConfig';
import { logger } from './logger';

type LogType = 'info' | 'success' | 'warn' | 'error';

const COLORS: Record<LogType, number> = {
  info: 0x5865f2, // blurple
  success: 0x57f287, // green
  warn: 0xfee75c, // yellow
  error: 0xed4245, // red
};

const ICON: Record<LogType, string> = {
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌',
};

/**
 * Wyślij embed z logiem na kanał ustawiony przez /config set-logs
 */
export async function sendGuildLog(
  client: Client,
  guildId: string,
  message: string,
  type: LogType = 'info',
) {
  try {
    const cfg = await getGuildConfig(guildId);
    if (!cfg.logChannelId) return;

    const ch = await client.channels.fetch(cfg.logChannelId);
    if (!ch || !(ch instanceof TextChannel)) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS[type])
      .setAuthor({ name: client.user?.tag ?? 'Bot' })
      .setTitle(`${ICON[type]} Zdarzenie bota`)
      .setDescription(message)
      .setTimestamp(new Date());

    await ch.send({ embeds: [embed] });
  } catch (err) {
    logger.error('Błąd wysyłania logu na kanał', { err });
  }
}
