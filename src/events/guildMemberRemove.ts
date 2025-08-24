import { GuildMember, EmbedBuilder } from 'discord.js';
import { sendGuildLog } from '../utils/guildLogger';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(member: GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle('🚪 Użytkownik opuścił serwer')
    .setDescription(`Pożegnajmy **${member.user.tag}**`)
    .addFields(
      { name: 'ID', value: member.id, inline: true },
      {
        name: 'Dołączył',
        value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : '—',
        inline: true,
      },
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0xed4245)
    .setTimestamp(new Date());

  await sendGuildLog(member.client, member.guild.id, 'Użytkownik wyszedł.', 'warn');
  const cfgLog = await member.client.channels
    .fetch(
      (await (await import('../config/guildConfig')).getGuildConfig(member.guild.id))
        .logChannelId ?? '',
    )
    .catch(() => null);
  if (cfgLog && 'send' in cfgLog) {
    // ts-expect-error jak wyżej
    await cfgLog.send({ embeds: [embed] }).catch(() => null);
  }
}
