import type { Bigint128 } from './Bigint128.ts';
import type { PotentialEvent } from './Event.ts';
import type { UInt16, UInt8 } from '@fe-db/proto';

export type CommandInputMessage = {
  /**
   * Recommended: supply a meaningful idempotency key as the command id.
   *
   * For example, if this have a command originates from a HTTP request, supply the request id as the command id. Then if the client repeats the request with the same id, they will receive the existing result rather than beginning a new command.
   */
  id?: Bigint128;
  aggregate: string;
  aggregateId: Bigint128;
  name: string;
  /**
   * Maximum number of times to attempt a command.
   * Default: 3
   */
  maxAttempts?: UInt8;
  /**
   * Number of milliseconds before trying again after a failure.
   * @default 2_000
   */
  attemptCooldownMs?: UInt8;
  attemptTimeoutSeconds?: UInt8;
  completionTimeOutSeconds?: UInt16;
  cacheDurationHours?: UInt16;
  /**
   * Provide contextual metadata such as trace id, span id, etc.
   */
  metadata?: Record<string | number, unknown>;
  /**
   * Provide any data required by the command handler
   */
  data?: Record<string | number, unknown>;
  /**
   * Set this to delay the execution of a command until after the provided Date object
   */
  startAfter?: Date;
};

export type CommandMessage = Omit<{ id: Bigint128 } & CommandInputMessage, 'maxAttempts'>;
export type CommandResult = PotentialEvent[] | Error | string;
