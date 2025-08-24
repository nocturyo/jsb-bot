import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { stopAll } from '../music/audioPlayer';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Zatrzymaj muzykę i wyczyść kolejkę');

export const category = 'Fun';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }
  stopAll(interaction.guildId);
  await interaction.reply({ content: '⏹️ Zatrzymano odtwarzanie.', ephemeral: true });
}
