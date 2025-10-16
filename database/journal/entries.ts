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
  id: CommandPending['id'];
  cmd: NewCommand;
};

export type CommandStartedEntry = EntryBase & {
  /**
   * journal entry kind
   */
  k: JournalEntryKind['cmdStarted'];
  /**
   * command id
   */
  id: CommandPending['id'];
  /**
   * entity
   */
  e: CommandPending['entity'];
  /**
   * entity id
   */
  eId: CommandPending['entityId'];
  /**
   * run id
   */
  rId: CommandRun['id'];
};
export type CommandFailedEntry = EntryBase & {
  /**
   * journal entry kind
   */
  k: JournalEntryKind['cmdFailed'];
  /**
   * command id
   */
  id: CommandPending['id'];
  res: Error | string;
};

export type CommandCompletedEntry = EntryBase & {
  k: JournalEntryKind['cmdCompleted'];
  /** command id */
  id: CommandPending['id'];
  evs: ResultEvent[];
};
type ResultEvent = unknown;
export type JournalEntry =
  | CommandIssuedEntry
  | CommandStartedEntry
  | CommandCompletedEntry
  | CommandFailedEntry;
