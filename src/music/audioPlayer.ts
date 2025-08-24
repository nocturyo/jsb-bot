import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
} from '@discordjs/voice';
import { Guild, VoiceBasedChannel } from 'discord.js';
import { logger } from '../utils/logger';
import { stream } from 'play-dl';
import ffmpeg from 'ffmpeg-static';

type Track = {
  query: string; // url lub zapytanie
  title?: string;
  requestedBy: string; // tag usera
};

const players = new Map<string, ReturnType<typeof createAudioPlayer>>();
const queues = new Map<string, Track[]>();

export function getQueue(guildId: string) {
  return queues.get(guildId) ?? [];
}

export async function enqueue(guild: Guild, channel: VoiceBasedChannel, track: Track) {
  const q = queues.get(guild.id) ?? [];
  q.push(track);
  queues.set(guild.id, q);

  if (!players.has(guild.id)) {
    // start nowego playera i połączenia
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    connection.on('stateChange', (_, n) => {
      if (n.status === VoiceConnectionStatus.Disconnected) {
        players.delete(guild.id);
        queues.delete(guild.id);
      }
    });

    const player = createAudioPlayer();
    player.on('error', (e) => logger.error('Audio player error', e));
    player.on(AudioPlayerStatus.Idle, () => {
      // zagraj następny
      const qq = queues.get(guild.id) ?? [];
      qq.shift(); // poprzedni skończony
      queues.set(guild.id, qq);
      void playNext(guild.id);
    });

    connection.subscribe(player);
    players.set(guild.id, player);
    await playNext(guild.id);
  } else {
    // jeśli już gra, tylko do kolejki
    // nic więcej
  }
}

async function playNext(guildId: string) {
  const q = queues.get(guildId) ?? [];
  const player = players.get(guildId);
  if (!player) return;

  const next = q[0];
  if (!next) {
    // brak kolejki → rozłącz po chwili
    const conn = getVoiceConnection(guildId);
    setTimeout(() => {
      if ((queues.get(guildId) ?? []).length === 0) {
        conn?.destroy();
        players.delete(guildId);
      }
    }, 10_000);
    return;
  }

  try {
    // play-dl: przyjmie link YT/Spotify (z resolverem) lub wyszuka, ale
    // dla zapytań tekstowych lepiej użyj play.search – tutaj zakładamy URL.
    const s = await stream(next.query, { quality: 2 });
    const resource = createAudioResource(s.stream, {
      inlineVolume: true,
      inputType: s.type,
      // ffmpeg-static bywa wymagany przy niektórych źródłach:
      metadata: { ffmpeg },
    });
    resource.volume?.setVolume(0.6);
    player.play(resource);
  } catch (err) {
    logger.error('Błąd odtwarzania', err);
    // usuń uszkodzony i spróbuj dalej
    q.shift();
    queues.set(guildId, q);
    await playNext(guildId);
  }
}

export async function skip(guildId: string) {
  const player = players.get(guildId);
  if (!player) return false;
  player.stop(true);
  return true;
}

export function stopAll(guildId: string) {
  queues.delete(guildId);
  const player = players.get(guildId);
  player?.stop(true);
  getVoiceConnection(guildId)?.destroy();
  players.delete(guildId);
}

export function isPlaying(guildId: string) {
  const player = players.get(guildId);
  return player?.state.status === AudioPlayerStatus.Playing;
}
