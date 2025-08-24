import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Bot powtarza podany tekst (opcjonalnie oznacza użytkownika).')
  .addStringOption((opt) =>
    opt
      .setName('tekst')
      .setDescription('Co mam powiedzieć?')
      .setRequired(true),
  )
  .addUserOption((opt) =>
    opt
      .setName('uzytkownik')
      .setDescription('Kogo oznaczyć (opcjonalnie)?')
      .setRequired(false),
  )
  .addBooleanOption((opt) =>
    opt
      .setName('ephemeral')
      .setDescription('Widoczne tylko dla Ciebie (tak/nie)')
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const text = interaction.options.getString('tekst', true);
  const user = interaction.options.getUser('uzytkownik');
  const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;

  const content = `${user ? `<@${user.id}> ` : ''}${text}`;
  await interaction.reply({ content, ephemeral });
}