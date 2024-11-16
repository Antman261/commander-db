import { Bigint128 } from "../primitive/Bigint128.ts";
import {
  CallStackClientInput,
  CallStackCompletedStored,
  CallStackExhaustedStored,
  CallStackPendingStored,
  CallStackRunningStored,
  Kind,
} from "./CallStack.ts";

export type CommandClientInput = Omit<CallStackClientInput, "kind"> & {
  kind: Kind["command"];
};

export type CommandPendingStored =
  & Omit<CallStackPendingStored, "kind">
  & {
    kind: Kind["command"];
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
  };

export type CommandRunningStored =
  & Omit<CallStackRunningStored, "kind">
  & Omit<CommandPendingStored, "status">;
export type CommandExhaustedStored =
  & Omit<CallStackExhaustedStored, "kind">
  & Omit<CommandPendingStored, "status">;

export type CommandCompletedStored =
  & Omit<CallStackCompletedStored, "kind">
  & Omit<CommandPendingStored, "status">;

export type CommandStored =
  | CommandPendingStored
  | CommandRunningStored
  | CommandExhaustedStored
  | CommandCompletedStored;
