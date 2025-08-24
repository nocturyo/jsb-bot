import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ChannelType,
} from 'discord.js';

// statyczne tematy
const staticTopics = ['server', 'user', 'ping', 'bot', 'help'];

export const data = new SlashCommandBuilder()
  .setName('topic')
  .setDescription('Pokaż informacje na wybrany temat lub kanał')
  .addStringOption((opt) =>
    opt
      .setName('name')
      .setDescription('Wybierz temat lub kanał')
      .setAutocomplete(true)
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const choice = interaction.options.getString('name', true);
  await interaction.reply(`🔎 Wybrałeś temat/kanał: **${choice}**`);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();

  // 1) podpowiedzi statyczne
  let choices = staticTopics;

  // 2) dodajemy kanały tekstowe z serwera (jeśli to nie DM)
  if (interaction.guild) {
    const textChannels = interaction.guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .map((ch) => ch.name);

    choices = [...choices, ...textChannels];
  }

  // filtrujemy wg tego, co user wpisuje
  const filtered = choices.filter((t) => t.toLowerCase().startsWith(focused));

  // ograniczamy do 25 wyników (limit Discord API)
  await interaction.respond(
    filtered.slice(0, 25).map((t) => ({ name: t, value: t })),
  );
}
