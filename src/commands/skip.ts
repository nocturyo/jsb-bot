import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { skip, isPlaying } from '../music/audioPlayer';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Pomiń aktualny utwór');

export const category = 'Fun';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }
  if (!isPlaying(interaction.guildId)) {
    await interaction.reply({ content: 'Nic aktualnie nie gra.', ephemeral: true });
    return;
  }
  await skip(interaction.guildId);
  await interaction.reply({ content: '⏭️ Pominięto.', ephemeral: true });
}
