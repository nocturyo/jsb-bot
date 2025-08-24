import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type Collection,
} from 'discord.js';

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
  // sort wewnątrz kategorii A→Z
  for (const k of CATEGORY_ORDER) grouped[k].sort((a, b) => a.data.name.localeCompare(b.data.name));
  return grouped;
}

function buildPages(commands: Collection<string, CommandModule>) {
  const grouped = groupCommands(commands);
  const pages: { embeds: EmbedBuilder[] }[] = [];

  for (const cat of CATEGORY_ORDER) {
    const list = grouped[cat];
    if (!list.length) continue;

    // dzielimy na „sekcje” po 6 komend, żeby nie robić ściany tekstu
    const chunkSize = 6;
    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const embed = new EmbedBuilder()
        .setTitle(`${CATEGORY_EMOJI[cat]} ${cat}`)
        .setDescription('Dostępne komendy w tej kategorii:')
        .setColor(0x5865f2)
        .setTimestamp(new Date());

      for (const cmd of chunk) {
        embed.addFields({
          name: `/${cmd.data.name}`,
          value: cmd.data.description ?? 'Brak opisu',
        });
      }
      pages.push({ embeds: [embed] });
    }
  }

  // Jeśli nie zbudowaliśmy nic (np. wszystkie hidden)
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

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Wyświetl listę dostępnych komend (grupowanie + przewijanie)');

export async function execute(interaction: ChatInputCommandInteraction) {
  const commands = interaction.client.commands;
  const pages = buildPages(commands);
  const page = 0;
  const ownerId = interaction.user.id;

  const rows = [buildNavRow(page, pages.length, ownerId)];

  const msg = await interaction.reply({
    ...pages[page],
    components: rows,
    ephemeral: true,
  });

  // Opcjonalnie: kolektor, który sam zamknie przyciski po 60s (w DEV przydatne)
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60_000,
  });

  collector.on('end', async () => {
    try {
      await msg.edit({ components: [] });
    } catch {}
  });
}

// Uwaga: obsługę kliknięć przycisków dodajemy w events/interactionCreate.ts
