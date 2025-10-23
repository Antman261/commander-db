import { z } from '@zod/zod';
import type { CommandMessage } from './Command.ts';
import type { Event } from './Event.ts';
import { encodedCommandId, encodedCommandMessage } from './Command.codec.ts';

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
  cmdIssued: { k: 6; cmdId: CommandMessage['id'] };
};

const dbMsgKind = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
const dbMsgEncoded = z.tuple(
  [dbMsgKind],
  z.union([encodedCommandMessage, encodedEvent, encodedCommandId]),
);
export type DbMessage = DbMessages[keyof DbMessages];
export const dbMsg = {
  commandSubscriptionGranted: 0,
  commandSubscriptionEnded: 1,
  commandAssigned: 2,
  eventSubscriptionGranted: 3,
  eventSubscriptionEnded: 4,
  eventsDispatched: 5,
  commandIssued: 6,
} as const;

export const commandSubscriptionGranted = (): DbMessages['cmdSubGranted'] => ({ k: 0 });
export const commandSubscriptionEnded = (): DbMessages['cmdSubEnded'] => ({ k: 1 });
export const commandAssigned = (cmd: CommandMessage): DbMessages['cmdAssigned'] => {
  return ({ k: 2, cmd });
};
export const eventSubscriptionGranted = (): DbMessages['eventSubGranted'] => ({ k: 3 });
export const eventSubscriptionEnded = (): DbMessages['eventSubEnded'] => ({ k: 4 });
export const eventsDispatched = (e: Event[]): DbMessages['events'] => ({ k: 5, e });
export const commandIssued = (cmdId: CommandMessage['id']): DbMessages['cmdIssued'] => ({ k: 6, cmdId });
