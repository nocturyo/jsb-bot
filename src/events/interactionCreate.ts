import {
  Interaction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Collection,
} from 'discord.js';
import { logger } from '../utils/logger';
import { sendGuildLog } from '../utils/guildLogger';

export const name = 'interactionCreate';
export const once = false;

const CATEGORY_ORDER = ['Admin', 'Info', 'Utility', 'Fun', 'Config'] as const;
const CATEGORY_EMOJI: Record<(typeof CATEGORY_ORDER)[number], string> = {
  Admin: '🛡️',
  Info: 'ℹ️',
  Utility: '🧰',
  Fun: '🎲',
  Config: '⚙️',
};
type Cat = (typeof CATEGORY_ORDER)[number];

function inferCategory(cmdName: string): Cat {
  const n = cmdName.toLowerCase();
  if (['kick', 'ban', 'clear'].includes(n)) return 'Admin';
  if (['help', 'info', 'ping', 'topic'].includes(n)) return 'Info';
  if (['say'].includes(n)) return 'Fun';
  if (['config'].includes(n)) return 'Config';
  return 'Utility';
}

function groupCommands(commands: Collection<string, CommandModule>) {
  const grouped: Record<Cat, CommandModule[]> = {
    Admin: [],
    Info: [],
    Utility: [],
    Fun: [],
    Config: [],
  };
  for (const [, cmd] of commands) {
    if (cmd.hidden) continue;
    const name = cmd.data.name;
    const cat = (cmd.category ?? inferCategory(name)) as Cat;
    grouped[cat].push(cmd);
  }
  for (const k of CATEGORY_ORDER) grouped[k].sort((a, b) => a.data.name.localeCompare(b.data.name));
  return grouped;
}

function buildPages(commands: Collection<string, CommandModule>) {
  const grouped = groupCommands(commands);
  const pages: { embeds: EmbedBuilder[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const list = grouped[cat];
    if (!list.length) continue;

    if (list.length) {
      const embed = new EmbedBuilder()
        .setTitle(`${CATEGORY_EMOJI[cat]} ${cat}`)
        .setDescription('Dostępne komendy w tej kategorii:')
        .setColor(0x5865f2)
        .setTimestamp(new Date());

      for (const cmd of list) {
        embed.addFields({
          name: `/${cmd.data.name}`,
          value: cmd.data.description ?? 'Brak opisu',
        });
      }
      pages.push({ embeds: [embed] });
    }
  }
  if (!pages.length) {
    pages.push({
      embeds: [
        new EmbedBuilder()
          .setTitle('📖 Brak komend')
          .setDescription('Nie znaleziono dostępnych komend.')
          .setColor(0x5865f2),
      ],
    });
  }
  return pages;
}

function buildNavRow(page: number, total: number, ownerId: string) {
  const prev = new ButtonBuilder()
    .setCustomId(`help:${ownerId}:prev:${page}`)
    .setLabel('◀︎')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 0);
  const next = new ButtonBuilder()
    .setCustomId(`help:${ownerId}:next:${page}`)
    .setLabel('▶︎')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= total - 1);
  const close = new ButtonBuilder()
    .setCustomId(`help:${ownerId}:close:${page}`)
    .setLabel('Zamknij')
    .setStyle(ButtonStyle.Danger);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(prev, next, close);
}

async function handleHelpButtons(interaction: ButtonInteraction) {
  const id = interaction.customId; // help:<ownerId>:<action>:<page>
  const [, ownerId, action, pageStr] = id.split(':');
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: 'Te przyciski nie są dla Ciebie.', ephemeral: true });
    return;
  }

  const pages = buildPages(interaction.client.commands);
  let page = Number(pageStr) || 0;

  if (action === 'close') {
    await interaction.message.edit({ components: [] }).catch(() => {});
    await interaction.deferUpdate();
    return;
  }
  if (action === 'prev') page = Math.max(0, page - 1);
  if (action === 'next') page = Math.min(pages.length - 1, page + 1);

  const rows = [buildNavRow(page, pages.length, ownerId)];
  await interaction.update({ ...pages[page], components: rows });
}

export async function execute(interaction: Interaction) {
  // 1) Obsługa przycisków help
  if (interaction.isButton() && interaction.customId.startsWith('help:')) {
    try {
      await handleHelpButtons(interaction);
    } catch (err) {
      logger.error('Błąd w help buttons', err);
      if (interaction.guildId) {
        await sendGuildLog(
          interaction.client,
          interaction.guildId,
          `Błąd przy paginacji **/help**`,
          'error',
        );
      }
    }
    return;
  }

  // 2) Autocomplete
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    try {
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (err) {
      logger.error('Błąd w autocomplete', err);
      if (interaction.guildId) {
        await sendGuildLog(
          interaction.client,
          interaction.guildId,
          `Błąd w autocomplete dla **/${interaction.commandName}**`,
          'error',
        );
      }
    }
    return;
  }

  // 3) Komendy slash
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('Błąd w komendzie', interaction.commandName, err);

    if (interaction.guildId) {
      await sendGuildLog(
        interaction.client,
        interaction.guildId,
        `Błąd w komendzie **/${interaction.commandName}**`,
        'error',
      );
    }

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          ephemeral: true,
        });
      }
    } catch {}
  }
}
