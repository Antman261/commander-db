import type { CommandInputMessage } from './Command.ts';

export type Event = { id: bigint; metadata: ObjWide; cmdId: bigint } & Obj;
export type PotentialEvent = Omit<Event, 'id'>;
export type CommandResult = PotentialEvent[] | Error | string;
type Obj = Record<string, unknown>;
type ObjWide = Record<string | number, unknown>;
/**
 * Messages sent from the database to the client
 */
export type DbMessage = {
  commandSubscriptionGranted: { k: 0 };
  commandSubscriptionEnded: { k: 1 };
  commandAssigned: { k: 2; cmd: CommandInputMessage };
  eventSubscriptionGranted: { k: 3; eventStream: ReadableStream<Event> };
  eventSubscriptionEnded: { k: 4 };
};
export type CmdSubMsgs = DbMessage['commandAssigned'] | DbMessage['commandSubscriptionEnded'];

/**
 * Messages sent from the client to the database
 */
export type ClientMessages = {
  requestCommandSubscription: { k: 0; ags?: string[] };
  endCommandSubscription: { k: 1 };
  commandCompleted: { k: 2; result: CommandResult };
  requestEventSubscription: { k: 3; from?: bigint };
  endEventSubscription: { k: 4 };
  issueCommand: { k: 5 } & CommandInputMessage;

  bye: { k: 6 };
};
export type ClientMessage = ClientMessages[keyof ClientMessages];

export const requestCommandSubscription = (ags?: string[]): ClientMessages['requestCommandSubscription'] => ({
  k: 0,
  ags,
});
export const endCommandSubscription = (): ClientMessages['endCommandSubscription'] => ({ k: 1 });
export const commandCompleted = (result: CommandResult): ClientMessages['commandCompleted'] => ({
  k: 2,
  result,
});
export const requestEventSubscription = (from?: bigint): ClientMessages['requestEventSubscription'] => ({
  k: 3,
  from,
});
export const endEventSubscription = (): ClientMessages['endEventSubscription'] => ({ k: 4 });
export const issueCommand = (cmd: CommandInputMessage): ClientMessages['issueCommand'] => ({ k: 5, ...cmd });
export const bye = (): ClientMessages['bye'] => ({ k: 6 });
