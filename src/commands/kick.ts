import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  User,
} from 'discord.js';
import { sendGuildLog } from '../utils/guildLogger';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Wyrzuć użytkownika z serwera')
  .addUserOption((opt) => opt.setName('user').setDescription('Kogo wyrzucić').setRequired(true))
  .addStringOption((opt) =>
    opt.setName('reason').setDescription('Powód (opcjonalnie)').setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('user', true) as User;
  const reason = interaction.options.getString('reason') ?? 'Brak powodu';

  // Sprawdź uprawnienia użytkownika i bota
  const memberPerms = interaction.memberPermissions;
  const me = interaction.guild.members.me;
  if (!memberPerms?.has(PermissionsBitField.Flags.KickMembers)) {
    await interaction.reply({ content: 'Nie masz uprawnienia **Kick Members**.', ephemeral: true });
    return;
  }
  if (!me?.permissions.has(PermissionsBitField.Flags.KickMembers)) {
    await interaction.reply({
      content: 'Bot nie ma uprawnienia **Kick Members**.',
      ephemeral: true,
    });
    return;
  }

  // Nie pozwalaj wyrzucać siebie/ownerów/wyższych rang
  if (targetUser.id === interaction.user.id) {
    await interaction.reply({
      content: 'Nie możesz wyrzucić samego/samej siebie.',
      ephemeral: true,
    });
    return;
  }

  const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (!target) {
    await interaction.reply({ content: 'Nie znaleziono członka na serwerze.', ephemeral: true });
    return;
  }
  if (!target.kickable) {
    await interaction.reply({
      content: 'Nie mogę wyrzucić tego użytkownika (rangi/pozycja).',
      ephemeral: true,
    });
    return;
  }

  // Dodatkowa walidacja pozycji ról względem wykonującego i bota
  const executor = await interaction.guild.members.fetch(interaction.user.id);
  const botMember = me!;
  if (target.roles.highest.comparePositionTo(executor.roles.highest) >= 0) {
    await interaction.reply({
      content: 'Nie możesz wyrzucić użytkownika z równą lub wyższą rolą.',
      ephemeral: true,
    });
    return;
  }
  if (target.roles.highest.comparePositionTo(botMember.roles.highest) >= 0) {
    await interaction.reply({
      content: 'Bot ma zbyt niską pozycję roli, by wyrzucić tego użytkownika.',
      ephemeral: true,
    });
    return;
  }

  await target.kick(`${reason} | by ${interaction.user.tag}`);
  await interaction.reply({
    content: `✅ Wyrzucono **${targetUser.tag}**. Powód: ${reason}`,
    ephemeral: true,
  });

  await sendGuildLog(
    interaction.client,
    interaction.guildId,
    `👢 **Kick**: ${targetUser.tag}\n👮 By: ${interaction.user.tag}\n📝 Powód: ${reason}`,
    'warn',
  );
}

export const category = 'Admin';
