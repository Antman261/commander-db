import type { CommandMessage } from './Command.ts';
import type { Event } from './Event.ts';

/**
 * Messages sent from the database to the client
 */
export type DbMessages = {
  cmdSubGranted: { k: 0 };
  cmdSubEnded: { k: 1 };
  cmdAssigned: { k: 2; cmd: CommandMessage };
  eventSubGranted: { k: 3 };
  eventSubEnded: { k: 4 };
  events: { k: 5; e: Event[] };
};
export type DbMessage = DbMessages[keyof DbMessages];
export const dbMsg = {
  commandSubscriptionGranted: 0,
  commandSubscriptionEnded: 1,
  commandAssigned: 2,
  eventSubscriptionGranted: 3,
  eventSubscriptionEnded: 4,
} as const;

export const commandSubscriptionGranted = (): DbMessages['cmdSubGranted'] => ({ k: 0 });
export const commandSubscriptionEnded = (): DbMessages['cmdSubEnded'] => ({ k: 1 });
export const commandAssigned = (cmd: CommandMessage): DbMessages['cmdAssigned'] => ({ k: 2, cmd });
export const eventSubscriptionGranted = (): DbMessages['eventSubGranted'] => ({ k: 3 });
export const eventSubscriptionEnded = (): DbMessages['eventSubEnded'] => ({ k: 4 });
export const eventsDispatched = (e: Event[]): DbMessages['events'] => ({ k: 5, e });
