import {
  CommandCompletedEntry,
  CommandIssuedEntry,
  CommandStartedEntry,
  entryKind,
  JournalEntry,
} from '@db/jnl';
import { cmdStatus, CommandPending, CommandRunning } from '@db/type';
import { isDefined, isUndefined } from '@antman/bool';

export type EntityInstanceKey = `${EntityStream['entity']}:${EntityStream['entityId']}`;
type Linked = { nextCmd?: CommandPending };
type LinkedRunningCommand = CommandRunning & Linked;
type LinkPendingCommand = CommandPending & Linked;
export type State = {
  streams: StreamMap;
  cmds: Map<CommandPending['id'], LinkedRunningCommand | LinkPendingCommand>;
};
type StreamMap = Record<EntityInstanceKey, EntityStream>;
export type EntityStream = {
  entityId: string | bigint;
  entity: string;
  headCommand?: LinkedRunningCommand | LinkPendingCommand;
  tailCommand?: LinkPendingCommand;
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
      const stream = getEntityStream(state.streams, cmd.entity, cmd.entityId);
      if (isUndefined(stream.headCommand)) stream.headCommand = cmd;
      if (isDefined(stream.tailCommand)) stream.tailCommand.nextCmd = cmd;
      stream.tailCommand = cmd;
      stream.depth++;
      state.cmds.set(cmd.id, cmd);
      break;
    }
    case entryKind.cmdStarted: {
      const cmd = state.cmds.get(entry.id);
      if (cmd?.status !== cmdStatus.pending) throw new Error('Corrupt journal entry');
      toRunning(cmd, entry);
      break;
    }
    case entryKind.cmdCompleted: {
      const cmd = state.cmds.get(entry.id);
      if (cmd?.status !== cmdStatus.pending) throw new Error('Corrupt journal entry');
      const stream = getEntityStream(state.streams, cmd.entity, cmd.entityId);
      if (isExpectedCommand(stream.headCommand, entry) === false) throw new Error('Corrupt journal entry');
      stream.headCommand = stream.headCommand.nextCmd;
      stream.depth--;
    }
  }
};
function isExpectedCommand(
  cmd: LinkedRunningCommand | LinkPendingCommand | undefined,
  entry: CommandIssuedEntry,
): cmd is LinkPendingCommand;
function isExpectedCommand(
  cmd: LinkedRunningCommand | LinkPendingCommand | undefined,
  entry: CommandStartedEntry,
): cmd is LinkPendingCommand;
function isExpectedCommand(
  cmd: LinkedRunningCommand | LinkPendingCommand | undefined,
  entry: CommandCompletedEntry,
): cmd is LinkedRunningCommand;
function isExpectedCommand<Entry extends JournalEntry>(
  cmd: LinkedRunningCommand | LinkPendingCommand | undefined,
  entry: Entry,
): boolean {
  const commandIdMatch = cmd?.id === entry.id;
  const commandStatusMatch = cmd?.status === cmdStatus.pending;
  return commandStatusMatch && commandIdMatch;
}
const toEntityInstanceKey = (
  entity: CommandRunning['entity'],
  entityId: CommandRunning['entityId'],
): EntityInstanceKey => `${entity}:${entityId}`;
const getEntityStream = (
  state: StreamMap,
  entity: CommandRunning['entity'],
  entityId: CommandRunning['entityId'],
): EntityStream => (state[toEntityInstanceKey(entity, entityId)] ??= {
  entityId: entityId,
  entity: entity,
  latestEventId: 0n,
  depth: 0,
});

const toRunning = (cmd: LinkPendingCommand, entry: CommandStartedEntry): LinkedRunningCommand =>
  Object.assign(cmd, {
    status: cmdStatus.running,
    runId: entry.rId,
    beganAt: entry.writtenAt,
  });
