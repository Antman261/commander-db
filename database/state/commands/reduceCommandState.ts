import { CommandStartedEntry, entryKind, JournalEntry } from '@db/jnl';
import { cmdStatus, CommandPending, CommandRunning } from '@db/type';

type PendingCommands = Map<bigint, CommandPending>;
type RunningCommands = Map<bigint, CommandRunning>;

export type State = {
  pending: PendingCommands;
  running: RunningCommands;
};

export const reduceCommandState = (state: State, entry: JournalEntry): void => {
  // todo
  switch (entry.k) {
    case entryKind.cmdIssued: {
      const command = entry.cmd;
      state.pending.set(command.id, command);
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

const toRunning = (cmd: CommandPending, entry: CommandStartedEntry): CommandRunning =>
  Object.assign(cmd, {
    status: cmdStatus.running,
    runId: entry.runId,
    beganAt: entry.writtenAt,
  });
