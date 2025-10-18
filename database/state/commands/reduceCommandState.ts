import {
  CommandCompletedEntry,
  CommandFailedEntry,
  CommandStartedEntry,
  entryKind,
  JournalEntry,
} from '@db/jnl';
import { cmdStatus, CommandCompleted, CommandExhausted, CommandPending, CommandRunning } from '@db/type';
import { isDefined, isUndefined } from '@antman/bool';
import { Mutable } from 'https://jsr.io/@antman/formic-utils/0.4.0/borrow/borrow.ts';
import { takeMutable } from '@antman/formic-utils';

export type EntityInstanceKey = `${EntityStream['entity']}:${EntityStream['entityId']}`;
type Linked = { nextCmd?: CommandPending };
type LinkedRunningCommand = CommandRunning & Linked;
type LinkedPendingCommand = CommandPending & Linked;
type LinkedCommand = LinkedRunningCommand | LinkedPendingCommand;
export type State = {
  streams: StreamMap;
  cmds: Map<CommandPending['id'], LinkedRunningCommand | LinkedPendingCommand>;
};
type StreamMap = Record<EntityInstanceKey, EntityStream>;
export type EntityStream = {
  entityId: string | bigint;
  entity: string;
  headCommand?: LinkedRunningCommand | LinkedPendingCommand;
  tailCommand?: LinkedPendingCommand;
  depth: number;
  // runningWorkflow?: Workflow;
  latestEventId: bigint;
};

export const getInitialState = (): State => ({
  streams: {},
  cmds: new Map(),
});

export const reduceCommandState = (state: State, entry: JournalEntry): void => {
  switch (entry.k) {
    case entryKind.cmdIssued: {
      const { cmd } = entry;
      const stream = getStream(state.streams, cmd.entity, cmd.entityId);
      appendStreamCommand(stream, cmd);
      state.cmds.set(cmd.id, cmd);
      break;
    }
    case entryKind.cmdStarted: {
      const cmd = isPending(state.cmds.get(entry.id));
      toRunning(takeMutable(cmd), entry);
      break;
    }
    case entryKind.cmdCompleted: {
      const cmd = isRunning(state.cmds.get(entry.id));
      toCompleted(takeMutable(cmd), entry);
      popStreamCommand(getStream(state.streams, cmd.entity, cmd.entityId));
      break;
    }
    case entryKind.cmdFailed: {
      const cmd = isRunning(state.cmds.get(entry.id));
      if (isExhausted(cmd)) {
        toExhausted(takeMutable(cmd), entry);
        popStreamCommand(getStream(state.streams, cmd.entity, cmd.entityId));
        break;
      }
      toPending(takeMutable(cmd), entry);
      break;
    }
  }
};

const addRun = <C extends LinkedCommand>(
  cmd: C,
  entry: CommandCompletedEntry | CommandFailedEntry,
): C => {
  cmd.runs.push({
    // deno-lint-ignore no-non-null-assertion
    id: cmd.runId!,
    appInstanceId: 'todo',
    connId: entry.connId,
    // deno-lint-ignore no-non-null-assertion
    beganAt: cmd.beganAt!,
    stoppedAt: entry.writtenAt,
    error: entry.k === entryKind.cmdFailed ? entry.res : undefined,
  });
  return cmd;
};
const toEntityInstanceKey = (
  entity: CommandRunning['entity'],
  entityId: CommandRunning['entityId'],
): EntityInstanceKey => `${entity}:${entityId}`;
const appendStreamCommand = (stream: EntityStream, cmd: CommandPending) => {
  if (isUndefined(stream.headCommand)) stream.headCommand = cmd;
  if (isDefined(stream.tailCommand)) stream.tailCommand.nextCmd = cmd;
  stream.tailCommand = cmd;
  stream.depth++;
};
const popStreamCommand = (stream: EntityStream): void => {
  const poppedCommand = stream.headCommand;
  if (isUndefined(poppedCommand)) return;
  stream.headCommand = stream.headCommand?.nextCmd;
  delete poppedCommand.nextCmd;
  stream.depth--;
};
const getStream = (
  state: StreamMap,
  entity: CommandRunning['entity'],
  entityId: CommandRunning['entityId'],
): EntityStream => (state[toEntityInstanceKey(entity, entityId)] ??= {
  entityId: entityId,
  entity: entity,
  latestEventId: 0n,
  depth: 0,
});

function isRunning(cmd: LinkedCommand | undefined): LinkedRunningCommand {
  if (cmd?.status !== cmdStatus.running) throw new Error('Corrupt journal entry');
  return cmd;
}
function isPending(cmd: LinkedCommand | undefined): LinkedPendingCommand {
  if (cmd?.status !== cmdStatus.pending) {
    throw new Error(`CorruptJournalEntry: Expected pending command, received ${cmd?.status} for ${cmd?.id}`);
  }
  return cmd;
}
const isExhausted = (cmd: LinkedCommand): boolean => cmd.runs.length === (+cmd.maxRuns - 1);

const toRunning = (cmd: Mutable<LinkedPendingCommand>, entry: CommandStartedEntry): LinkedRunningCommand =>
  Object.assign(cmd, {
    status: cmdStatus.running,
    connId: entry.connId,
    runId: entry.rId,
    beganAt: entry.writtenAt,
  });

const toExhausted = (cmd: Mutable<LinkedRunningCommand>, entry: CommandFailedEntry): CommandExhausted =>
  Object.assign(addRun(cmd, entry), {
    status: cmdStatus.exhausted,
    exhaustedAt: entry.writtenAt,
  });
const toPending = (cmd: Mutable<LinkedRunningCommand>, entry: CommandFailedEntry): LinkedPendingCommand =>
  Object.assign(addRun(cmd, entry), {
    status: cmdStatus.pending,
    runAfter: entry.writtenAt + +cmd.runCooldownMs,
    runId: undefined,
    connId: undefined,
  });
const toCompleted = (cmd: Mutable<LinkedRunningCommand>, entry: CommandCompletedEntry): CommandCompleted =>
  Object.assign(addRun(cmd, entry), {
    status: cmdStatus.completed,
    completedAt: entry.writtenAt,
    result: entry.res,
  });
