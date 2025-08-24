import type { Collection, SlashCommandBuilder } from 'discord.js';

declare global {
  interface CommandModule {
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => Promise<unknown> | unknown;
    autocomplete?: (...args: unknown[]) => Promise<unknown> | unknown;

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
