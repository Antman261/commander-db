import { CommandPending, DateTime } from '@db/type';

const journalEntryKind = {
  cmdIssued: 0,
  cmdStarted: 1,
  cmdFailed: 2,
  cmdCompleted: 3,
} as const;
type JournalEntryKind = typeof journalEntryKind;

type EntryBase = {
  appInstanceId: string;
  writtenAt: DateTime;
};

type NewCommand = Omit<CommandPending, 'error'>;

export type CommandIssuedEntry = EntryBase & {
  kind: JournalEntryKind['cmdIssued'];
  command: NewCommand;
};

export type CommandStartedEntry = EntryBase & {
  kind: JournalEntryKind['cmdStarted'];
  commandId: CommandPending['id'];
};
