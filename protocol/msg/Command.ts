import type { Bigint128 } from './Bigint128.ts';
import type { PotentialEvent } from './Event.ts';
import type { UInt16, UInt8 } from '@fe-db/proto';
import type { Obj } from './Obj.ts';

export type CommandInputMessage = {
  /**
   * Recommended: supply a meaningful idempotency key as the command id.
   *
   * For example, for a command issued from a HTTP request, you could supply the request id as the command id. Then, if the client repeats the request with the same id, they will receive the existing result rather than issuing. a new command.
   */
  id?: Bigint128;
  subject: string;
  subjectId: Bigint128 | string;
  /**
   * A parentCommandId will only be present if the command was issued from within a workflow.
   */
  parentCommandId?: Bigint128;
  /**
   * Use in combination with command id to scope idempotency checks, typically with third parties. For example:
   * ```
   * source: 'STRIPE',
   * id: stripeRequest.headers['x-idempotency-key'],
   * ```
   */
  source?: string;
  /**
   * Provide the name of the command -- used to call the command handler on a command processing client
   */
  name: string;
  /**
   * Maximum number of times CommanderDB will attempt the command
   * @default 3
   */
  maxRuns?: UInt8;
  /**
   * Number of milliseconds before CommanderDB will re-aattempt a failed command
   * @default 2_000
   */
  runCooldownMs?: UInt8;
  /**
   * Specify, in seconds, when CommanderDB should consider an incomplete command run to have failed.
   *
   * @default 5 seconds
   */
  runTimeoutSeconds?: UInt8;
  /**
   * How long CommanderDB should persist the command id and optional source in its idempotency cache. While in the cache, subsequent attempts to issue a command with the same id will return the result of the previously issued command without rerunning it.
   *
   * @default 96 hours
   */
  cacheDurationHours?: UInt16;
  /**
   * Provide metadata such as trace id. Injected into the command processor's OpenTelemetry context, providing trace propagation
   */
  metadata?: Obj;
  /**
   * Provide data required by the command handler
   */
  input?: Obj;
  /**
   * Set this to delay the execution of a command until after the provided Date object
   */
  runAfter?: Date;
};

export type CommandMessage = Omit<{ id: Bigint128 } & CommandInputMessage, 'maxAttempts'>;
export type CommandResult = PotentialEvent[] | Error | string;
