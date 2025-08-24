import type { Collection, SlashCommandBuilder } from 'discord.js';

// === Globalny typ komendy – dostępny wszędzie bez importu ===
declare global {
  interface CommandModule {
    data: SlashCommandBuilder;
    execute: (...args: any[]) => Promise<any> | any;
    autocomplete?: (...args: any[]) => Promise<any> | any;
  }
}

// Augmentacja Client – ma mapę komend
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>;
  }
}

export {};
