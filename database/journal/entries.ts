import { CommandPending, DateTime } from '@db/type';

export const jnlEntryKind = {
  cmdIssued: 0,
  cmdStarted: 1,
  cmdFailed: 2,
  cmdCompleted: 3,
} as const;
type JournalEntryKind = typeof jnlEntryKind;

type EntryBase = {
  connId: string; // connection id
  // writtenAt: DateTime;
};

type NewCommand = Omit<CommandPending, 'error'>;

export type CommandIssuedEntry = EntryBase & {
  k: JournalEntryKind['cmdIssued'];
  cmd: NewCommand;
};

export type CommandStartedEntry = EntryBase & {
  k: JournalEntryKind['cmdStarted'];
  cmdId: CommandPending['id'];
};

export type JnlEntryInput = CommandIssuedEntry | CommandStartedEntry;
