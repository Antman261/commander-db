import { StackId } from "./StackId.ts";
import { AppInstance } from "./AppInstance.ts";
import { Bigint128 } from "../primitive/Bigint128.ts";
import { SmallIntU } from "../primitive/SmallIntU.ts";
import { TinyIntU } from "../primitive/TinyIntU.ts";
import { DateTime } from "../primitive/DateTime.ts";
import { UnknownObject } from "../primitive/UnknownObject.ts";
import { StackFrameStored } from "./StackFrame.ts";

export const kind = { stack: 0, workflow: 1, command: 2 } as const;
export type Kind = typeof kind;

export const callStackStatus = {
  pending: 0,
  running: 1,
  exhausted: 2,
  completed: 3,
} as const;

export type CallStackStatus = typeof callStackStatus;

export type CallStackClientInput =
  & Omit<
    CallStackPendingStored,
    | "status"
    | "kind"
    | "runs"
    | "willRunAt"
    | "createdAt"
    | "error"
    | "id"
    | "maxRuns"
    | "runCooldownMs"
    | "context"
    | "args"
  >
  & {
    /**
     * Recommended: supply a meaningful idempotency key as the call stack id. Otherwise, an id is derived from the funcName and args.
     *
     * For example, if this call stack began with a HTTP request, you could supply the request id as the call stack id. Then if the client repeats the request with the same id, they will receive the existing result rather than beginning a new call stack.
     */
    id?: CallStackPendingStored["id"];
    /**
     * Maximum number of times to attempt a call stack.
     * Default: 3
     */
    maxRuns?: CallStackPendingStored["maxRuns"];
    /**
     * Number of milliseconds before trying again after a failure.
     * Default: 2_000
     */
    runCooldownMs?: CallStackPendingStored["runCooldownMs"];
    /**
     * calling context such as request ids, trace ids, etc. provided if the call stack is resumed after a failure to ensure open telemetry data is not lost between attempts
     */
    context: CallStackPendingStored["context"];
    /**
     * arguments passed to the call stack function
     */
    args: CallStackPendingStored["args"];
    /**
     * Set this value to delay the execution of a call stack
     */
    runAfter?: DateTime; // when set, runAfter becomes the willRunAt value for a call stack
  };

export type CallStackPendingStored = {
  id: StackId;
  kind: Kind["stack"];
  status: CallStackStatus["pending"];
  /**
   * the name will always be a function name, but its referred to as a command or workflow name depending on the kind
   */
  name: string;
  args: unknown[];
  context: UnknownObject;
  /**
   * the result of any completed stack frames within the call stack
   */
  frames: StackFrameStored[];
  runs: TinyIntU;
  maxRuns: TinyIntU;
  runCooldownMs: TinyIntU;
  runTimeoutSeconds: TinyIntU;
  completionTimeOutSeconds: SmallIntU;
  cacheDurationHours: SmallIntU;
  willRunAt: DateTime;
  createdAt: DateTime; // becomes the willRunAt time for call stacks created without a runAfter time
};

export type CallStackRunningStored = Omit<CallStackPendingStored, "status"> & {
  status: CallStackStatus["running"];
  appInstanceId: AppInstance["id"]; // if command: the appInstanceId has a lock on the aggregate instance
  attemptId: CallStackAttemptStored["id"]; // else: the attempt id has a lock on the StackId
  beganAt: DateTime;
};

export type CallStackExhaustedStored =
  & Omit<CallStackPendingStored, "status">
  & {
    status: CallStackStatus["exhausted"];
    beganAt: DateTime;
    exhaustedAt: DateTime;
    attempts: CallStackAttemptStored[]; // will be stored in a separate file from running and pending stacks
  };

export type CallStackCompletedStored =
  & Omit<CallStackPendingStored, "status">
  & {
    status: CallStackStatus["completed"];
    beganAt: DateTime;
    completedAt: DateTime;
    result: UnknownObject;
    attempts: CallStackAttemptStored[];
  };

export type CallStackAttemptStored = {
  id: Bigint128; // otel span id
  stackId: StackId; // otel parent span id?
  appInstanceId: AppInstance["id"];
  beganAt: DateTime;
  stoppedAt: DateTime; // we don't store running attempts, only failed or completed
  error?: unknown; // the successful attempt will be the last, and it won't have an error
};

/**
 * used to look up call stack errors
 */
export type CallStackAttempts = Map<StackId, CallStackAttemptStored[]>;

type StackResultCacheEntry = {
  stackId: StackId;
  result: UnknownObject;
  expiresAt: DateTime;
};
/**
 * A cache of recent call stack results optimized for fast resolution of cache hit and miss
 */
export type StackResultCache = {
  data: Map<StackId, StackResultCacheEntry>;
  /**
   * cache entries sorted by expiresAt DateTime to facilitate fast cache cleansing
   */
  expiration: StackResultCacheEntry[];
};

/**
 * Keeps track of each CallStack run attempted by application instances. Key-value store of instance id and an array of attempts
 */
export type CallStackRunsMap = Record<AppInstance["id"], Date[]>;
