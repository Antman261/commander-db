import type { CommandId, CommandInputMessage, CommandResult } from './Command.ts';

/**
 * Messages sent from the client to the database
 */
export type ClientMessages = {
  requestCommandSubscription: { k: 0; ags?: string[]; num: number };
  endCommandSubscription: { k: 1 };
  commandCompleted: { k: 2; r: CommandResult; cid: CommandId };
  requestEventSubscription: { k: 3; from?: bigint };
  endEventSubscription: { k: 4 };
  issueCommand: { k: 5 } & CommandInputMessage;
  bye: { k: 6 };
};
export const clientMsg = {
  requestCommandSubscription: 0,
  endCommandSubscription: 1,
  commandCompleted: 2,
  requestEventSubscription: 3,
  endEventSubscription: 4,
  issueCommand: 5,
  bye: 6,
} as const;
type ClientMessageKinds = typeof clientMsg;
type ClientMessageKind = ClientMessageKinds[keyof ClientMessageKinds];
const clientMsgDisplay = Object.fromEntries(
  Object.entries(clientMsg).map(([key, val]) => [val, key]),
) as Record<ClientMessageKind, keyof ClientMessageKinds>;
export const toClientMsgKind = (kind: ClientMessageKind): keyof ClientMessageKinds => clientMsgDisplay[kind];
/**
 * Messages sent from the client to the database
 */
export type ClientMessage = ClientMessages[keyof ClientMessages];

/**
 * Request a command subscription to begin processing commands dispatched by CommanderDB
 */
export const requestCommandSubscription = (
  num: number,
  ags?: string[],
): ClientMessages['requestCommandSubscription'] => ({
  k: 0,
  num,
  ags,
});
export const endCommandSubscription = (): ClientMessages['endCommandSubscription'] => ({ k: 1 });
export const commandCompleted = (
  r: CommandResult,
  cid: CommandId,
): ClientMessages['commandCompleted'] => ({ k: 2, r, cid });
export const requestEventSubscription = (from?: bigint): ClientMessages['requestEventSubscription'] => ({
  k: 3,
  from,
});
export const endEventSubscription = (): ClientMessages['endEventSubscription'] => ({ k: 4 });
export const issueCommand = (cmd: CommandInputMessage): ClientMessages['issueCommand'] => ({ k: 5, ...cmd });
export const bye = (): ClientMessages['bye'] => ({ k: 6 });
