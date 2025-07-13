import { CommandMessage } from './Command.ts';

export type Event = { id: bigint; metadata: ObjWide; cmdId: bigint } & Obj;
export type PotentialEvent = Omit<Event, 'id'>;
type Obj = Record<string, unknown>;
type ObjWide = Record<string | number, unknown>;

export const clientMsgKind = {
  requestCommandSubscription: 0,
  endCommandSubscription: 1,
  commandCompleted: 2,
  requestEventSubscription: 3,
  endEventSubscription: 4,
  issueCommand: 5,
} as const;

export const dbMsgKind = {
  commandSubscriptionGranted: 0,
  commandSubscriptionEnded: 1,
  commandAssigned: 2,
  eventSubscriptionGranted: 3,
  eventSubscriptionEnded: 4,
  eventDispatched: 5,
} as const;

export type DbMessageKinds = typeof dbMsgKind;
export type DbMessageKindKey = keyof DbMessageKinds;
export type DbMessageKind = DbMessageKinds[DbMessageKindKey];
type ToDbMessage<K extends DbMessageKindKey> = { k: DbMessageKinds[K] };

export type CommandSubscriptionGranted = ToDbMessage<'commandSubscriptionGranted'>;
export type CommandSubscriptionEnded = ToDbMessage<'commandSubscriptionEnded'>;
export type CommandAssigned = ToDbMessage<'commandAssigned'>;
export type EventSubscriptionGranted = ToDbMessage<'eventSubscriptionGranted'>;
export type EventSubscriptionEnded = ToDbMessage<'eventSubscriptionEnded'>;
export type EventDispatched = ToDbMessage<'eventDispatched'>;
export type DbMessage =
  | CommandSubscriptionGranted
  | CommandSubscriptionEnded
  | CommandAssigned
  | EventSubscriptionGranted
  | EventSubscriptionEnded
  | EventDispatched;

export type ClientMessageKinds = typeof clientMsgKind;
export type ClientMessageKindKey = keyof ClientMessageKinds;
export type ClientMessageKind = ClientMessageKinds[ClientMessageKindKey];
type ToClientMessage<K extends ClientMessageKindKey> = { k: ClientMessageKinds[K] };

export type RequestCommandSubscription = ToClientMessage<'requestCommandSubscription'>;
export type EndCommandSubscription = ToClientMessage<'endCommandSubscription'>;
export type CommandCompleted = ToClientMessage<'commandCompleted'> & { events: PotentialEvent[] };
export type RequestEventSubscription = ToClientMessage<'requestEventSubscription'> & { from?: number };
export type EndEventSubscription = ToClientMessage<'endEventSubscription'>;
export type IssueCommand = ToClientMessage<'issueCommand'> & CommandMessage;
export type ClientMessage =
  | RequestCommandSubscription
  | EndCommandSubscription
  | CommandCompleted
  | RequestEventSubscription
  | EndEventSubscription
  | IssueCommand;

//
