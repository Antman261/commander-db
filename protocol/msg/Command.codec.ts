import { z } from '@zod/zod';
import type { CommandInputMessage } from './Command.ts';

const decodedCommandMessage = z.object({
  entity: z.string(),
  entityId: z.union([z.bigint(), z.string()]),
  id: z.bigint(),
  idempotentPeriodHours: z.number(),
  input: z.record(z.string(), z.unknown()),
  maxRuns: z.number(),
  metadata: z.record(z.string(), z.unknown()),
  name: z.string(),
  parentCommandId: z.bigint(),
  runAfter: z.number(),
  runCooldownMs: z.number(),
  runTimeoutSeconds: z.number(),
  source: z.string(),
}).required();

const encodedCommandMessage = z.tuple([
  z.instanceof(Uint8Array),
  z.string(),
  z.union([z.bigint(), z.string()]),
  z.bigint(),
  z.record(z.string(), z.unknown()),
  z.record(z.string(), z.unknown()),
  z.string(),
  z.bigint(),
  z.number(),
  z.string(),
]);
export const commandMessageCodec = z.codec(decodedCommandMessage, encodedCommandMessage, {
  decode: (msg) =>
    [
      new Uint8Array([
        msg.maxRuns ?? -1,
        msg.runCooldownMs ?? -1,
        msg.runTimeoutSeconds ?? -1,
        msg.idempotentPeriodHours ?? -1,
      ]),
      msg.entity,
      msg.entityId,
      msg.id,
      msg.input,
      msg.metadata,
      msg.name,
      msg.parentCommandId,
      msg.runAfter,
      msg.source,
    ] as const,
  encode: (m) => ({
    maxRuns: m[0][0],
    runCooldownMs: m[0][1],
    runTimeoutSeconds: m[0][2],
    idempotentPeriodHours: m[0][3],
    entity: m[1],
    entityId: m[2],
    id: m[3],
    input: m[4],
    metadata: m[5],
    name: m[6],
    parentCommandId: m[7],
    runAfter: m[8],
    source: m[9],
  }),
});
