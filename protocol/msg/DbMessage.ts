import { z } from '@zod/zod';
import type { CommandMessage } from './Command.ts';
import { decodedEvents, encodedEvents, eventCodec } from './Event.ts';
import {
  cmdId,
  commandMessageCodec as cmdMsgCodec,
  decodedCommandMessage as decodedCmdMsg,
  encodedCommandMessage,
} from './Command.codec.ts';
import type { OfK } from '@proto/util';

const dbMsgKindZ = z.enum({
  cmdSubGranted: 0,
  cmdSubEnded: 1,
  cmdAssigned: 2,
  eventSubGranted: 3,
  eventSubEnded: 4,
  events: 5,
  cmdIssued: 6,
});
export const dbMsgKind = dbMsgKindZ.enum;
type DbMsgKind = z.infer<typeof dbMsgKindZ>;
const { cmdSubGranted, cmdSubEnded, cmdAssigned, eventSubGranted, eventSubEnded, events, cmdIssued } =
  dbMsgKind;

const cmdSubGrantedDecoded = z.strictObject({ k: z.literal(cmdSubGranted) });
type CmdSubGrantedDecoded = z.infer<typeof cmdSubGrantedDecoded>;
const cmdSubEndedDecoded = z.strictObject({ k: z.literal(cmdSubEnded) });
type CmdSubEndedDecoded = z.infer<typeof cmdSubEndedDecoded>;
const cmdAssignedDecoded = z.strictObject({ k: z.literal(cmdAssigned), cmd: decodedCmdMsg });
type CmdAssignedDecoded = z.infer<typeof cmdAssignedDecoded>;
const eventSubGrantedDecoded = z.strictObject({ k: z.literal(eventSubGranted) });
type EventSubGrantedDecoded = z.infer<typeof eventSubGrantedDecoded>;
const eventSubEndedDecoded = z.strictObject({ k: z.literal(eventSubEnded) });
type EventSubEndedDecoded = z.infer<typeof eventSubEndedDecoded>;
const eventsDecoded = z.strictObject({ k: z.literal(events), e: decodedEvents });
type EventsDecoded = z.infer<typeof eventsDecoded>;
const cmdIssuedDecoded = z.strictObject({ k: z.literal(cmdIssued), cmdId });
type CmdIssuedDecoded = z.infer<typeof cmdIssuedDecoded>;
export const dbMsgDecoded = z.discriminatedUnion('k', [
  cmdSubGrantedDecoded,
  cmdSubEndedDecoded,
  cmdAssignedDecoded,
  eventSubGrantedDecoded,
  eventSubEndedDecoded,
  eventsDecoded,
  cmdIssuedDecoded,
]);
export type DbMsg = z.infer<typeof dbMsgDecoded>;

export const cmdSubGrantedEncoded = z.tuple([z.literal(cmdSubGranted)]);
export type CmdSubGrantedEncoded = z.infer<typeof cmdSubGrantedEncoded>;
export const cmdSubEndedEncoded = z.tuple([z.literal(cmdSubEnded)]);
export type CmdSubEndedEncoded = z.infer<typeof cmdSubEndedEncoded>;
export const cmdAssignedEncoded = z.tuple([z.literal(cmdAssigned), encodedCommandMessage]);
export type CmdAssignedEncoded = z.infer<typeof cmdAssignedEncoded>;
export const eventSubGrantedEncoded = z.tuple([z.literal(eventSubGranted)]);
export type EventSubGrantedEncoded = z.infer<typeof eventSubGrantedEncoded>;
export const eventSubEndedEncoded = z.tuple([z.literal(eventSubEnded)]);
export type EventSubEndedEncoded = z.infer<typeof eventSubEndedEncoded>;
export const eventsEncoded = z.tuple([z.literal(events)], encodedEvents);
export type EventsEncoded = z.infer<typeof eventsEncoded>;
export const cmdIssuedEncoded = z.tuple([z.literal(cmdIssued), cmdId]);
export type CmdIssuedEncoded = z.infer<typeof cmdIssuedEncoded>;

export const cmdSubGrantedCodec = z.codec(cmdSubGrantedEncoded, cmdSubGrantedDecoded, {
  encode: (m): CmdSubGrantedEncoded => [m.k],
  decode: (m) => ({ k: m[0] }),
});
export const cmdSubEndedCodec = z.codec(cmdSubEndedEncoded, cmdSubEndedDecoded, {
  encode: (m): CmdSubEndedEncoded => [m.k],
  decode: (m) => ({ k: m[0] }),
});
export const cmdAssignedCodec = z.codec(cmdAssignedEncoded, cmdAssignedDecoded, {
  encode: (m): CmdAssignedEncoded => [
    m.k,
    cmdMsgCodec.encode(decodedCmdMsg.parse(m.cmd)),
  ],
  decode: (m) => ({ k: m[0], cmd: cmdMsgCodec.decode(m[1]) }),
});
export const eventSubGrantedCodec = z.codec(eventSubGrantedEncoded, eventSubGrantedDecoded, {
  encode: (m): EventSubGrantedEncoded => [m.k],
  decode: (m) => ({ k: m[0] }),
});
export const eventSubEndedCodec = z.codec(eventSubEndedEncoded, eventSubEndedDecoded, {
  encode: (m): EventSubEndedEncoded => [m.k],
  decode: (m) => ({ k: m[0] }),
});
export const eventsCodec = z.codec(eventsEncoded, eventsDecoded, {
  encode: (m): EventsEncoded => [m.k, eventCodec.encode(m.e)],
  decode: (m) => ({ k: m[0], e: eventCodec.decode(m[1]) }),
});

export const cmdIssuedCodec = z.codec(cmdIssuedEncoded, cmdIssuedDecoded, {
  encode: (m): CmdIssuedEncoded => [m.k, m.cmdId],
  decode: (m) => ({ k: m[0], cmdId: m[1] }),
});
const codecMap = {
  [cmdSubGranted]: cmdSubGrantedCodec,
  [cmdSubEnded]: cmdSubEndedCodec,
  [cmdAssigned]: cmdAssignedCodec,
  [eventSubGranted]: eventSubGrantedCodec,
  [eventSubEnded]: eventSubEndedCodec,
  [events]: eventsCodec,
  [cmdIssued]: cmdIssuedCodec,
} as const satisfies Record<DbMsgKind, z.ZodCodec>;
export const dbMsgEncoded = z.union([
  cmdSubGrantedEncoded,
  cmdSubEndedEncoded,
  cmdAssignedEncoded,
  eventSubGrantedEncoded,
  eventSubEndedEncoded,
  eventsEncoded,
  cmdIssuedEncoded,
]);
export const dbMsgCodec = z.codec(dbMsgEncoded, dbMsgDecoded, {
  encode: (o) => codecMap[o.k].encode(o as any),
  decode: (o) => codecMap[o[0]].decode(o as any),
});
type OfDbMsg<T> = OfK<DbMsg, T>;
export const commandSubscriptionGranted = (): OfDbMsg<typeof cmdSubGranted> => ({ k: cmdSubGranted });
export const commandSubscriptionEnded = (): OfDbMsg<typeof cmdSubEnded> => ({ k: cmdSubEnded });
export const commandAssigned = (cmd: CmdAssignedDecoded['cmd']): OfDbMsg<typeof cmdAssigned> => ({
  k: cmdAssigned,
  cmd,
});
export const eventSubscriptionGranted = (): OfDbMsg<typeof eventSubGranted> => ({ k: eventSubGranted });
export const eventSubscriptionEnded = (): OfDbMsg<typeof eventSubEnded> => ({ k: eventSubEnded });
export const eventsDispatched = (e: EventsDecoded['e']): OfDbMsg<typeof events> => ({ k: events, e });
export const commandIssued = (cmdId: CommandMessage['id']): OfDbMsg<typeof cmdIssued> => ({
  k: cmdIssued,
  cmdId,
});
