import { CommandPendingStored, DateTime, WorkflowStored } from '@db/type';

const journalEntryKind = {
  cmdIssued: 0,
  cmdStarted: 1,
  cmdFailed: 2,
  cmdCompleted: 3,
  wkflowStarted: 4,
  wkflowReqStarted: 5,
  wkflowReqFailed: 6,
  wkflowReqCompleted: 7,
  stackContinued: 8, // ?
  stackErrored: 9,
} as const;
type JournalEntryKind = typeof journalEntryKind;

type DraftEntryBase = {
  appInstanceId: string;
  submittedAt: DateTime;
};

type NewCommand = Omit<CommandPendingStored, 'error'>;

export type CommandIssuedDraftEntry = DraftEntryBase & {
  kind: JournalEntryKind['cmdIssued'];
  command: NewCommand;
  /**
   * A workflowStackId will only be present if the command was issued from within a workflow.
   */
  workflowStackId?: WorkflowStored['id'];
};

export type CommandStartedDraftEntry = DraftEntryBase & {
  kind: JournalEntryKind['cmdStarted'];
  /**
   * The command id will be used as the stack id for the resulting call stack
   */
  commandId: CommandPendingStored['id'];
};

export type StackContinuedDraftEntry = DraftEntryBase & {
  kind: JournalEntryKind['stackContinued'];
  stackId: CallStackStored['id'];
  commandId?: CommandPendingStored['id'];
};
