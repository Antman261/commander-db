import { $brand, z } from '@zod/zod';

const decodedCommandMessage = z.strictObject({
  entity: z.string().describe(''),
  entityId: z.union([z.bigint(), z.string()]),
  id: z.bigint().describe('Recommended: supply a meaningful idempotency key as the command id'),
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
}).required().brand('cmdMsg');
export type DecodedCommandMessage = z.infer<typeof decodedCommandMessage>;

export const encodedCommandId = z.bigint().describe('cmd: id');
export const encodedCommandMessage = z.tuple([
  z.instanceof(ArrayBuffer).describe(
    'Buffer storing maxRuns, runCooldownMs, runTimeoutSeconds, and idempotentPeriodHours',
  ),
  z.string().describe('cmd: entity'),
  z.union([z.bigint(), z.string()]).describe('cmd: entityId'),
  encodedCommandId,
  z.record(z.string(), z.unknown()).describe('cmd: input'),
  z.record(z.string(), z.unknown()).describe('cmd: metadata'),
  z.string().describe('cmd: name'),
  z.bigint().describe('cmd: parentCommandId'),
  z.number().describe('cmd: runAfter'),
  z.string().describe('cmd: source'),
]);
export type EncodedCommandMessage = z.infer<typeof encodedCommandMessage>;
export const commandMessageCodec = z.codec(decodedCommandMessage, encodedCommandMessage, {
  decode: (msg) => {
    const buf = new ArrayBuffer(5);
    new Uint8Array(buf, 0, 3).set([
      msg.maxRuns ?? -1,
      msg.runCooldownMs ?? -1,
      msg.runTimeoutSeconds ?? -1,
    ]);
    new Uint16Array(buf, 3, 1).set([msg.idempotentPeriodHours ?? -1]);
    const encoded: EncodedCommandMessage = [
      buf,
      msg.entity,
      msg.entityId,
      msg.id,
      msg.input,
      msg.metadata,
      msg.name,
      msg.parentCommandId,
      msg.runAfter,
      msg.source,
    ];
    return encoded;
  },
  encode: (m) => {
    const ui8s = new Uint8Array(m[0], 0, 3);
    const ui16 = new Uint16Array(m[0], 3, 1);
    const coded: DecodedCommandMessage = {
      maxRuns: ui8s[0],
      runCooldownMs: ui8s[1],
      runTimeoutSeconds: ui8s[2],
      idempotentPeriodHours: ui16[3],
      entity: m[1],
      entityId: m[2],
      id: m[3],
      input: m[4],
      metadata: m[5],
      name: m[6],
      parentCommandId: m[7],
      runAfter: m[8],
      source: m[9],
    };
    return coded;
  },
});
