import type {
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';

declare global {
  interface CommandModule {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<unknown> | unknown;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<unknown> | unknown;

    category?: 'Admin' | 'Info' | 'Fun' | 'Utility' | 'Config';
    hidden?: boolean;
  }
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>;
  }
}

export {};
