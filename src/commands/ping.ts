import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCom mandBuilder()
  .setName('ping')
  .setDescription('Sprawdź czas reakcji bota');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const diff = sent.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(`Pong! Opóźnienie: ${diff} ms`);
}
