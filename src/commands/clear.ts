import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  ChannelType,
  TextChannel,
  User,
} from 'discord.js';
import { sendGuildLog } from '../utils/guildLogger';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Usuń wiadomości z bieżącego kanału')
  .addIntegerOption((opt) =>
    opt
      .setName('amount')
      .setDescription('Ile wiadomości usunąć (1–100)')
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true),
  )
  .addUserOption((opt) =>
    opt
      .setName('user')
      .setDescription('Usuwaj tylko wiadomości tego użytkownika (opcjonalnie)')
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }

  const memberPerms = interaction.memberPermissions;
  const me = interaction.guild.members.me;
  if (!memberPerms?.has(PermissionsBitField.Flags.ManageMessages)) {
    await interaction.reply({
      content: 'Nie masz uprawnienia **Manage Messages**.',
      ephemeral: true,
    });
    return;
  }
  if (!me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    await interaction.reply({
      content: 'Bot nie ma uprawnienia **Manage Messages**.',
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Ta komenda działa tylko na kanale tekstowym.',
      ephemeral: true,
    });
    return;
  }

  const amount = interaction.options.getInteger('amount', true);
  const filterUser = interaction.options.getUser('user') as User | null;

  let deleted = 0;

  if (!filterUser) {
    // Szybka ścieżka: bulkDelete (tylko wiadomości <14 dni)
    const result = await (channel as TextChannel).bulkDelete(amount, true);
    deleted = result.size;
  } else {
    // Filtrowanie po autorze: pobierz do 100 ostatnich i usuń pasujące (ograniczenie API)
    const fetched = await (channel as TextChannel).messages.fetch({ limit: 100 });
    const toDelete = fetched.filter((m) => m.author.id === filterUser.id).first(amount);

    for (const m of toDelete) {
      await m.delete().catch(() => null);
      deleted++;
    }
  }

  await interaction.reply({
    content: `🧹 Usunięto ${deleted}/${amount} wiadomości${filterUser ? ` użytkownika **${filterUser.tag}**` : ''}.`,
    ephemeral: true,
  });

  await sendGuildLog(
    interaction.client,
    interaction.guildId,
    `🧹 **Clear**: ${deleted}/${amount} ${filterUser ? `| Użytkownik: ${filterUser.tag}` : ''}\n👮 By: ${interaction.user.tag}\n📍 Kanał: <#${(channel as TextChannel).id}>`,
    'info',
  );
}

export const category = 'Admin';
