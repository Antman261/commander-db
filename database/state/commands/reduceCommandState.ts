import { CommandStartedEntry, entryKind, JournalEntry } from '@db/jnl';
import { cmdStatus, CommandPending, CommandRunning } from '@db/type';

export type SubjectInstanceKey = `${SubjectStream['subject']}:${SubjectStream['subjectId']}`;
export type State = Record<SubjectInstanceKey, SubjectStream>;
export type SubjectStream = {
  subjectId: string | bigint;
  subject: string;
  queue: CommandPending[];
  runningCommand?: CommandRunning;
  childCommand?: CommandRunning;
  latestEventId: bigint;
};

export const getInitialState = (): State => ({});

export const reduceCommandState = (state: State, entry: JournalEntry): void => {
  // todo
  switch (entry.k) {
    case entryKind.cmdIssued: {
      const command = entry.cmd;
      getSubjectStream(state, command).queue.push(command);
      break;
    }
    case entryKind.cmdStarted: {
      const { cmdId } = entry;

      const pendingCommand = state.pending.get(cmdId);
      if (pendingCommand) {
        state.pending.delete(cmdId);
        state.running.set(cmdId, toRunning(pendingCommand, entry));
        return;
      }
    }
  }
};
type Subjectable = Pick<CommandPending, 'subject' | 'subjectId'>;
const toSubjectInstanceKey = (cmd: Subjectable): SubjectInstanceKey => `${cmd.subject}:${cmd.subjectId}`;
const getSubjectStream = (
  state: State,
  cmd: Subjectable,
): SubjectStream => (state[toSubjectInstanceKey(cmd)] ??= {
  subjectId: cmd.subjectId,
  subject: cmd.subject,
  queue: [],
  latestEventId: 0n,
});

const toRunning = (cmd: CommandPending, entry: CommandStartedEntry): CommandRunning =>
  Object.assign(cmd, {
    status: cmdStatus.running,
    runId: entry.runId,
    beganAt: entry.writtenAt,
  });
