import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  GuildMember,
} from 'discord.js';
import { enqueue, getQueue } from '../music/audioPlayer';
import * as play from 'play-dl';

function isURL(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Zwraca pewny link do YouTube video (oraz tytuł) na podstawie:
 * - linku YouTube,
 * - linku Spotify (mapowane do YT po tytule),
 * - frazy tekstowej (pierwszy wynik YT).
 */
async function resolveToYoutube(input: string): Promise<{ url: string; title?: string } | null> {
  // 1) URL: rozpoznaj źródło
  if (isURL(input)) {
    const kind = await play.validate(input);
    if (kind === 'yt_video') {
      // YouTube video – gotowe
      const info = await play.video_basic_info(input);
      return { url: input, title: info?.video_details?.title };
    }
    if (kind === 'sp_track') {
      // Spotify track → pobierz meta i wyszukaj pierwszy wynik na YT
      const sp = await play.spotify(input);
      // @ts-expect-error typy play-dl są luźne – ostrożne pobranie
      const track = sp?.name && sp?.artists ? `${sp.name} ${sp.artists?.[0]?.name ?? ''}` : null;
      if (!track) return null;
      const results = await play.search(track, { source: { youtube: 'video' }, limit: 1 });
      const first = results[0] as unknown;
      if (typeof first === 'object' && first !== null) {
        const obj = first as { url?: unknown; title?: unknown };
        if (typeof obj.url === 'string')
          return { url: obj.url, title: typeof obj.title === 'string' ? obj.title : undefined };
      }
      return null;
    }
    // (opcjonalnie) playlisty YT/Spotify – tu na razie pomijamy
    // Możesz dorobić w kolejnym kroku.
  }

  // 2) Fraza tekstowa → pierwszy wynik YT
  const results = await play.search(input, { source: { youtube: 'video' }, limit: 1 });
  const first = results[0] as unknown;
  if (typeof first === 'object' && first !== null) {
    const obj = first as { url?: unknown; title?: unknown };
    if (typeof obj.url === 'string') {
      return { url: obj.url, title: typeof obj.title === 'string' ? obj.title : undefined };
    }
  }
  return null;
}

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Odtwórz muzykę z linku (YT/Spotify) lub frazy')
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

  const resolved = await resolveToYoutube(input);
  if (!resolved) {
    await interaction.editReply('Nie znaleziono źródła audio dla podanego wejścia.');
    return;
  }

  await enqueue(interaction.guild, voice, {
    query: resolved.url,
    title: resolved.title,
    requestedBy: interaction.user.tag,
  });

  const q = getQueue(interaction.guild.id);
  await interaction.editReply(
    q.length === 1
      ? `▶️ Zaczynam odtwarzanie: **${resolved.title ?? resolved.url}**`
      : `➕ Dodano do kolejki: **${resolved.title ?? resolved.url}** (pozycja ${q.length})`,
  );
}
