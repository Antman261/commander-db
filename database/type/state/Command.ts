import { Obj } from '@antman/formic-utils';
import { Bigint128 } from '../primitive/Bigint128.ts';
import { UInt16, UInt8 } from '@fe-db/proto';
import { DateTime } from '../primitive/DateTime.ts';

/**
 * Kinds of command -- workflows and requests are just special types of commands.
 */
export const kind = { standard: 0, workflow: 1, request: 2 } as const;
export type Kind = typeof kind;

export const commandStatus = {
  pending: 0,
  running: 1,
  exhausted: 2,
  completed: 3,
} as const;

export type CommandStatus = typeof commandStatus;

export type CommandClientInput =
  & Omit<
    CommandPending,
    | 'status'
    | 'kind'
    | 'runs'
    | 'willRunAt'
    | 'createdAt'
    | 'error'
    | 'id'
    | 'maxRuns'
    | 'runCooldownMs'
    | 'context'
    | 'args'
    | 'parentCommandId'
  >
  & {
    /**
     * Recommended: supply a meaningful idempotency key as the command id.
     *
     * For example, for a command issued from a HTTP request, you could supply the request id as the command id. Then, if the client repeats the request with the same id, they will receive the existing result rather than issuing. a new command.
     */
    id?: CommandPending['id'];
    /**
     * Maximum number of times CommanderDB will attempt the command
     * @default 3
     */
    maxRuns?: CommandPending['maxRuns'];
    /**
     * Number of milliseconds before CommanderDB will re-aattempt a failed command
     * @default 2_000
     */
    runCooldownMs?: CommandPending['runCooldownMs'];
    /**
     * Provide metadata such as trace id. Injected into the command processor's OpenTelemetry context, providing trace propagation
     */
    metadata: CommandPending['metadata'];
    /**
     * The parameters of a command, provided to the command processor
     */
    input: CommandPending['input'];
    /**
     * The primary entity the command will mutate -- AKA the aggregate in Domain-Driven Design. For example, 'account' in a billing system issuing invoices.
     */
    subject: CommandPending['subject'];
    /**
     * The id of the instance of the subject. For example, the account id against which an invoice will be issued in a billing system.
     */
    subjectId: CommandPending['subjectId'];
    workflowId?: CommandPending['parentCommandId'];
    /**
     * Use in combination with command id to scope idempotency checks, typically with third parties. For example:
     * ```
     * source: 'STRIPE',
     * id: stripeRequest.headers['x-idempotency-key'],
     * ```
     */
    source?: CommandPending['source'];
    /**
     * Set runAfter to delay the execution of a command
     *
     * For example, a command to invalidate a purchase order after 7 days if payment hasn't being received
     */
    runAfter?: CommandPending['runAfter'];
  };

export type CommandPending = {
  id: Bigint128;
  kind: Kind;
  status: CommandStatus['pending'];
  /**
   * the name will always be a function name, but its referred to as a command or workflow name depending on the kind
   */
  name: string;
  subject: string;
  subjectId: Bigint128;
  source?: string;
  input: unknown;
  // output: unknown; -- a pending command can't have an output yet
  metadata: Obj;
  /**
   * A parentCommandId will only be present if the command was issued from within a workflow.
   */
  parentCommandId?: Bigint128;
  runs: UInt8;
  maxRuns: UInt8;
  runCooldownMs: UInt8;
  runTimeoutSeconds: UInt8;
  completionTimeOutSeconds: UInt16;
  cacheDurationHours: UInt16;
  runAfter?: DateTime;
  createdAt: DateTime;
};

export type CommandRunning = Omit<CommandPending, 'status'> & {
  status: CommandStatus['running'];
  attemptId: CommandAttempt['id'];
  beganAt: DateTime;
};

export type CommandExhausted =
  & Omit<CommandPending, 'status'>
  & {
    status: CommandStatus['exhausted'];
    beganAt: DateTime;
    exhaustedAt: DateTime;
    attempts: CommandAttempt[]; // will be stored in a separate file from running and pending stacks
  };

export type CommandCompleted =
  & Omit<CommandPending, 'status'>
  & {
    status: CommandStatus['completed'];
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
