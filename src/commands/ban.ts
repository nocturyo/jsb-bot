import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  User,
} from 'discord.js';
import { sendGuildLog } from '../utils/guildLogger';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Zbanuj użytkownika')
  .addUserOption((opt) => opt.setName('user').setDescription('Kogo zbanować').setRequired(true))
  .addStringOption((opt) =>
    opt.setName('reason').setDescription('Powód (opcjonalnie)').setRequired(false),
  )
  .addIntegerOption((opt) =>
    opt
      .setName('delete_days')
      .setDescription('Usuń wiadomości z ostatnich dni (0/1/7)')
      .addChoices(
        { name: '0 dni', value: 0 },
        { name: '1 dzień', value: 1 },
        { name: '7 dni', value: 7 },
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('user', true) as User;
  const reason = interaction.options.getString('reason') ?? 'Brak powodu';
  const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
  const deleteMessageSeconds = Math.min(Math.max(deleteDays, 0), 7) * 24 * 60 * 60;

  const memberPerms = interaction.memberPermissions;
  const me = interaction.guild.members.me;
  if (!memberPerms?.has(PermissionsBitField.Flags.BanMembers)) {
    await interaction.reply({ content: 'Nie masz uprawnienia **Ban Members**.', ephemeral: true });
    return;
  }
  if (!me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    await interaction.reply({
      content: 'Bot nie ma uprawnienia **Ban Members**.',
      ephemeral: true,
    });
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({
      content: 'Nie możesz zbanować samego/samej siebie.',
      ephemeral: true,
    });
    return;
  }

  const target = await interaction.guild.members.fetch({ user: targetUser.id }).catch(() => null);

  // Jeśli użytkownik jest na serwerze, weryfikujemy role; jeśli nie — można banować po ID
  if (target) {
    if (!target.bannable) {
      await interaction.reply({
        content: 'Nie mogę zbanować tego użytkownika (rangi/pozycja).',
        ephemeral: true,
      });
      return;
    }
    const executor = await interaction.guild.members.fetch(interaction.user.id);
    const botMember = me!;
    if (target.roles.highest.comparePositionTo(executor.roles.highest) >= 0) {
      await interaction.reply({
        content: 'Nie możesz zbanować użytkownika z równą lub wyższą rolą.',
        ephemeral: true,
      });
      return;
    }
    if (target.roles.highest.comparePositionTo(botMember.roles.highest) >= 0) {
      await interaction.reply({
        content: 'Bot ma zbyt niską pozycję roli, by zbanować tego użytkownika.',
        ephemeral: true,
      });
      return;
    }
  }

  await interaction.guild.members.ban(targetUser.id, {
    reason: `${reason} | by ${interaction.user.tag}`,
    deleteMessageSeconds,
  });

  await interaction.reply({
    content: `✅ Ban dla **${targetUser.tag}**. Powód: ${reason}${deleteDays ? ` | Usunięto wiadomości: ${deleteDays}d` : ''}`,
    ephemeral: true,
  });

  await sendGuildLog(
    interaction.client,
    interaction.guildId,
    `⛔ **Ban**: ${targetUser.tag}\n👮 By: ${interaction.user.tag}\n📝 Powód: ${reason}\n🗑 Usunięte wiadomości: ${deleteDays}d`,
    'error',
  );
}

export const category = 'Admin';
