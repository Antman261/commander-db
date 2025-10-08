import { CommandPending, CommandRun, DateTime } from '@db/type';

export const entryKind = {
  cmdIssued: 0,
  cmdStarted: 1,
  cmdFailed: 2,
  cmdCompleted: 3,
} as const;
type JournalEntryKind = typeof entryKind;

type EntryBase = {
  connId: string; // connection id
  writtenAt: DateTime;
};

type NewCommand = Omit<CommandPending, 'error'>;

export type CommandIssuedEntry = EntryBase & {
  k: JournalEntryKind['cmdIssued'];
  cmd: NewCommand;
};

export type CommandStartedEntry = EntryBase & {
  k: JournalEntryKind['cmdStarted'];
  cmdId: CommandPending['id'];
  runId: CommandRun['id'];
};

export type JournalEntry = CommandIssuedEntry | CommandStartedEntry;
