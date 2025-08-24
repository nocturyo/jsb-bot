import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Podstawowe informacje o bocie i serwerze');

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.user.tag;
  const guild = interaction.guild?.name ?? 'DM';
  await interaction.reply({
    content: `Cześć **${user}**! Jesteś na: **${guild}**.`,
    ephemeral: true,
  });
}

export const category = 'Info';
