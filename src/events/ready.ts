import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';
import { sendGuildLog } from '../utils/guildLogger';

export const name = 'ready';
export const once = true;

export function execute(client: Client) {
  if (!client.user) return;

  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/help', type: ActivityType.Playing }],
  });

  const guildCount = client.guilds.cache.size;
  logger.info(`Zalogowano jako ${client.user.tag} | Gildie: ${guildCount}`);

  // informacja o starcie w ładnym embedzie
  client.guilds.cache.forEach((g) => {
    void sendGuildLog(client, g.id, `Bot \`${client.user?.tag}\` jest online!`, 'success');
  });
}
