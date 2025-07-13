import type { Bigint128 } from './Bigint128.ts';
import type { UInt16, UInt8 } from '@fe-db/proto';

export type CommandMessage = {
  /**
   * Recommended: supply a meaningful idempotency key as the command id.
   *
   * For example, if this have a command originates from a HTTP request, supply the request id as the command id. Then if the client repeats the request with the same id, they will receive the existing result rather than beginning a new command.
   */
  id?: Bigint128;
  aggregate: string;
  aggregateId: Bigint128;
  /**
   * used in combination with uniqueId to prevent duplicate commands from being issued. For example:
   * ```
   * source: 'STRIPE',
   * uniqueId: stripeRequest.headers['x-idempotency-key'],
   * ```
   */
  source?: string;
  uniqueId?: Bigint128;
  /**
   * Maximum number of times to attempt a command.
   * Default: 3
   */
  maxRuns?: UInt8;
  /**
   * Number of milliseconds before trying again after a failure.
   * @default 2_000
   */
  runCooldownMs?: UInt8;
  runTimeoutSeconds: UInt8;
  completionTimeOutSeconds: UInt16;
  cacheDurationHours: UInt16;
  /**
   * Provide contextual metadata such as trace id, span id, etc.
   */
  metadata?: Record<string | number, unknown>;
  /**
   * Data for the command handler
   */
  data: Record<string | number, unknown>;
  /**
   * Set this to delay the execution of a command
   */
  runAfter?: Date;
};
