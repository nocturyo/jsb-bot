import { Collection } from 'discord.js';

export interface CommandModule {
  data: { name: string };
  execute: Function;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, CommandModule>;
  }
}
