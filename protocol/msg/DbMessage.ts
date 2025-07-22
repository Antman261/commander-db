import type { CommandMessage } from './Command.ts';
import type { Event } from './Event.ts';

/**
 * Messages sent from the database to the client
 */
export type DbMessage = {
  commandSubscriptionGranted: { k: 0 };
  commandSubscriptionEnded: { k: 1 };
  commandAssigned: { k: 2; cmd: CommandMessage };
  eventSubscriptionGranted: { k: 3; eventStream: ReadableStream<Event> };
  eventSubscriptionEnded: { k: 4 };
};
export const dbMsg = {
  commandSubscriptionGranted: 0,
  commandSubscriptionEnded: 1,
  commandAssigned: 2,
  eventSubscriptionGranted: 3,
  eventSubscriptionEnded: 4,
} as const;
export type DbCmdSubMsgs = DbMessage['commandAssigned'] | DbMessage['commandSubscriptionEnded'];

export const commandSubscriptionGranted = (): DbMessage['commandSubscriptionGranted'] => ({ k: 0 });
export const commandSubscriptionEnded = (): DbMessage['commandSubscriptionEnded'] => ({ k: 1 });
export const commandAssigned = (cmd: CommandMessage): DbMessage['commandAssigned'] => ({ k: 2, cmd });
export const eventSubscriptionGranted = (
  eventStream: ReadableStream<Event>,
): DbMessage['eventSubscriptionGranted'] => ({ k: 3, eventStream });
export const eventSubscriptionEnded = (): DbMessage['eventSubscriptionEnded'] => ({ k: 4 });
