import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Collection } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Wyświetl listę dostępnych komend');

export async function execute(interaction: ChatInputCommandInteraction) {
  const commands = interaction.client.commands as Collection<string, CommandModule>;

  const embed = new EmbedBuilder()
    .setTitle('📖 Lista komend')
    .setDescription('Oto wszystkie dostępne komendy:')
    .setColor(0x5865f2);

  for (const [name, cmd] of commands) {
    embed.addFields({
      name: `/${name}`,
      value: cmd.data.description ?? 'Brak opisu',
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
