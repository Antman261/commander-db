import type { CommandInputMessage, CommandResult } from './Command.ts';

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
export const clientMsg = {
  requestCommandSubscription: 0,
  endCommandSubscription: 1,
  commandCompleted: 2,
  requestEventSubscription: 3,
  endEventSubscription: 4,
  issueCommand: 5,
  bye: 6,
} as const;
/**
 * Messages sent from the client to the database
 */
export type ClientMessage = ClientMessages[keyof ClientMessages];

/**
 * Request a command subscription to begin processing commands dispatched by CommanderDB
 */
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
