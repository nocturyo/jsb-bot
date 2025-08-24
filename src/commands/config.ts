import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  TextChannel,
} from 'discord.js';
import { getGuildConfig, setGuildConfig } from '../config/guildConfig';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Ustawienia bota dla tego serwera')
  .addSubcommand((sc) => sc.setName('get').setDescription('Pokaż aktualną konfigurację'))
  .addSubcommand((sc) =>
    sc
      .setName('set-language')
      .setDescription('Ustaw język odpowiedzi bota')
      .addStringOption((opt) =>
        opt
          .setName('language')
          .setDescription('Język')
          .setRequired(true)
          .addChoices({ name: 'Polski', value: 'pl' }, { name: 'English', value: 'en' }),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName('set-logs')
      .setDescription('Ustaw kanał do logów')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('Kanał tekstowy')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName('set-ephemeral')
      .setDescription('Czy odpowiedzi domyślnie mają być ephemeral')
      .addBooleanOption((opt) =>
        opt.setName('value').setDescription('true/false').setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'get') {
    const cfg = await getGuildConfig(interaction.guildId);
    const lines = [
      `**language**: ${cfg.language}`,
      `**ephemeralDefault**: ${cfg.ephemeralDefault ? 'true' : 'false'}`,
      `**logChannelId**: ${cfg.logChannelId ?? '—'}`,
    ];
    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    return;
  }

  if (sub === 'set-language') {
    const language = interaction.options.getString('language', true) as 'pl' | 'en';
    const cfg = await setGuildConfig(interaction.guildId, { language });
    await interaction.reply({ content: `✅ language = ${cfg.language}`, ephemeral: true });
    return;
  }

  if (sub === 'set-logs') {
    const ch = interaction.options.getChannel('channel', true);
    const channel = ch as TextChannel;
    const cfg = await setGuildConfig(interaction.guildId, { logChannelId: channel.id });
    await interaction.reply({
      content: `✅ logChannelId = <#${cfg.logChannelId}>`,
      ephemeral: true,
    });
    return;
  }

  if (sub === 'set-ephemeral') {
    const value = interaction.options.getBoolean('value', true);
    const cfg = await setGuildConfig(interaction.guildId, { ephemeralDefault: value });
    await interaction.reply({
      content: `✅ ephemeralDefault = ${cfg.ephemeralDefault}`,
      ephemeral: true,
    });
    return;
  }
}

export const category = 'Admin';
