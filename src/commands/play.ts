import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  GuildMember,
} from 'discord.js';
import { enqueue, getQueue } from '../music/audioPlayer';
import { search } from 'play-dl';

function isURL(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Odtwórz muzykę z linku lub po wyszukaniu na YouTube')
  .addStringOption((opt) =>
    opt
      .setName('query')
      .setDescription('Link (YT/Spotify) lub fraza do wyszukania')
      .setRequired(true),
  );

export const category = 'Fun';

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  const voice = member.voice.channel;
  if (!voice || voice.type !== ChannelType.GuildVoice) {
    await interaction.reply({ content: 'Wejdź najpierw na kanał głosowy.', ephemeral: true });
    return;
  }

  const input = interaction.options.getString('query', true);
  await interaction.deferReply({ ephemeral: true });

  let url = input;
  let title: string | undefined;

  // Jeśli nie URL -> wyszukaj na YouTube i weź pierwszy wynik
  if (!isURL(input)) {
    const results = await search(input, { source: { youtube: 'video' }, limit: 1 });

    const first = results[0] as unknown;
    // Bezpieczne zawężanie typu
    let rUrl: string | undefined;
    let rTitle: string | undefined;

    if (typeof first === 'object' && first !== null) {
      const obj = first as { url?: unknown; title?: unknown };
      if (typeof obj.url === 'string') rUrl = obj.url;
      if (typeof obj.title === 'string') rTitle = obj.title;
    }

    if (!rUrl) {
      await interaction.editReply('Nie znaleziono żadnych wyników.');
      return;
    }
    url = rUrl;
    title = rTitle;
  }

  await enqueue(interaction.guild, voice, {
    query: url,
    title,
    requestedBy: interaction.user.tag,
  });

  const q = getQueue(interaction.guild.id);
  await interaction.editReply(
    q.length === 1
      ? `▶️ Zaczynam odtwarzanie: **${title ?? url}**`
      : `➕ Dodano do kolejki: **${title ?? url}** (pozycja ${q.length})`,
  );
}
