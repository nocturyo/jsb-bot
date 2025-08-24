import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'ready';
export const once = true;

export function execute(client: Client) {
  if (!client.user) return;

  // Ustawiamy presence, żeby jasno było widać, że bot jest online
  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/ping • /say', type: ActivityType.Playing }],
  });

  const guildCount = client.guilds.cache.size;
  logger.info(`Zalogowano jako ${client.user.tag} | Gildie: ${guildCount}`);
}
