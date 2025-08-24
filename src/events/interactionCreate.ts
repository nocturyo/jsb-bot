import { Interaction } from 'discord.js';
import { logger } from '../utils/logger';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction) {
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName) as any;
    try {
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (err) {
      logger.error('Błąd w autocomplete', err);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName) as any;
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
