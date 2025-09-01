import { Obj } from '@antman/formic-utils';
import { Bigint128 } from '../primitive/Bigint128.ts';
import { CommandInputMessage, UInt16, UInt8 } from '@fe-db/proto';
import { DateTime } from '../primitive/DateTime.ts';

/**
 * Kinds of command -- workflows and requests are just special types of commands.
 */
export const cmdKind = { standard: 0, workflow: 1, request: 2 } as const;
type CmdKinds = typeof cmdKind;
export type CmdKindS = keyof CmdKinds;
export type CmdKindI = CmdKinds[CmdKindS];

export const cmdStatus = {
  pending: 0,
  running: 1,
  exhausted: 2,
  completed: 3,
} as const;

type CmdStatuses = typeof cmdStatus;
export type CmdStatusS = keyof CmdStatuses;
export type CmdStatusI = CmdStatuses[CmdStatusS];

export type CommandPending = {
  id: NonNullable<CommandInputMessage['id']>;
  kind: CmdKindI;
  status: CmdStatuses['pending'];
  name: CommandInputMessage['name'];
  subject: CommandInputMessage['subject'];
  subjectId: CommandInputMessage['subjectId'];
  source?: CommandInputMessage['source'];
  input?: CommandInputMessage['input'];
  // output: unknown; -- a pending command can't have an output yet
  metadata: NonNullable<CommandInputMessage['metadata']>;
  parentCommandId?: CommandInputMessage['parentCommandId'];
  runs: UInt8;
  maxRuns: UInt8;
  runCooldownMs: UInt8;
  runTimeoutSeconds: UInt8;
  cacheDurationHours: UInt16;
  runAfter?: DateTime;
  createdAt: DateTime;
};

export type CommandRunning = Omit<CommandPending, 'status'> & {
  status: CmdStatuses['running'];
  attemptId: CommandAttempt['id'];
  beganAt: DateTime;
};

export type CommandExhausted =
  & Omit<CommandPending, 'status'>
  & {
    status: CmdStatuses['exhausted'];
    beganAt: DateTime;
    exhaustedAt: DateTime;
    attempts: CommandAttempt[]; // will be stored in a separate file from running and pending stacks
  };

export type CommandCompleted =
  & Omit<CommandPending, 'status'>
  & {
    status: CmdStatuses['completed'];
    beganAt: DateTime;
    completedAt: DateTime;
    output: Obj;
    attempts: CommandAttempt[];
  };

export type CommandAttempt = {
  id: Bigint128; // otel span id
  commandId: CommandPending['id'];
  appInstanceId: string;
  beganAt: DateTime;
  stoppedAt: DateTime; // we don't store running attempts, only failed or completed
  error?: unknown; // the successful attempt will be the last, and it won't have an error
};

type CommandResultCacheEntry = {
  commandId: CommandPending['id'];
  result: CommandCompleted['output'];
  expiresAt: DateTime;
};
/**
 * A cache of recent command results optimized for fast resolution of cache hit and miss
 */
export type CommandResultCache = {
  data: Map<CommandPending['id'], CommandResultCacheEntry>;
  /**
   * cache entries sorted by expiresAt DateTime to facilitate fast cache cleansing
   */
  expiration: CommandResultCacheEntry[];
};

/**
 * Keeps track of each command attempted by application instances. Key-value store of instance id and an array of attempts
 */
export type CommandAttemptsMap = Record<string, Date[]>;
