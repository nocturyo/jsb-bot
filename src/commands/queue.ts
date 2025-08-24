import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getQueue, isPlaying } from '../music/audioPlayer';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Pokaż kolejkę utworów');

export const category = 'Fun';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }
  const q = getQueue(interaction.guildId);
  if (!q.length) {
    await interaction.reply({ content: 'Kolejka jest pusta.', ephemeral: true });
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle(isPlaying(interaction.guildId) ? '🎶 Teraz gramy + kolejka' : '🕒 Kolejka')
    .setColor(0x5865f2);

  q.slice(0, 10).forEach((t, i) => {
    embed.addFields({
      name: `${i === 0 ? '▶️' : `${i}.`} ${t.title ?? 'Utwór'}`,
      value: t.query,
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
