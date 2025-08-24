import { Interaction } from 'discord.js';
import { logger } from '../utils/logger';
import { sendGuildLog } from '../utils/guildLogger';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction) {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    try {
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (err) {
      logger.error('Błąd w autocomplete', err);
      if (interaction.guildId) {
        await sendGuildLog(
          interaction.client,
          interaction.guildId,
          `Błąd w autocomplete dla **/${interaction.commandName}**`,
          'error',
        );
      }
    }
    return;
  }

  // Komendy slash
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('Błąd w komendzie', interaction.commandName, err);

    if (interaction.guildId) {
      await sendGuildLog(
        interaction.client,
        interaction.guildId,
        `Błąd w komendzie **/${interaction.commandName}**`,
        'error',
      );
    }

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
