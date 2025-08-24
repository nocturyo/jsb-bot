import { GuildMember, EmbedBuilder } from 'discord.js';
import { sendGuildLog } from '../utils/guildLogger';

export const name = 'guildMemberAdd';
export const once = false;

export async function execute(member: GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle('✅ Nowy użytkownik dołączył')
    .setDescription(`Witamy **${member.user.tag}**`)
    .addFields(
      { name: 'ID', value: member.id, inline: true },
      {
        name: 'Konto utworzone',
        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0x57f287)
    .setTimestamp(new Date());

  await sendGuildLog(member.client, member.guild.id, 'Użytkownik dołączył.', 'success');
  // jeśli wolisz pełny embed zamiast krótkiego tekstu – wyślij bezpośrednio:
  const cfgLog = await member.client.channels
    .fetch(
      (await (await import('../config/guildConfig')).getGuildConfig(member.guild.id))
        .logChannelId ?? '',
    )
    .catch(() => null);
  // jeśli kanał jest ustawiony i pobrany – wyślij embed (bez kruszenia się, gdy brak)
  if (cfgLog && 'send' in cfgLog) {
    // ts-expect-error typ guard dla TextChannel mamy w guildLogger – tu wysyłamy bezpiecznie
    await cfgLog.send({ embeds: [embed] }).catch(() => null);
  }
}
