import { z } from '@zod/zod';
import { newUint16Tuple, newUint8Tuple, numZod } from '../util/mod.ts';
import { transferableRecord } from '@proto/struct';

// todo: Consider building a zod-binary package using https://github.com/iwoplaza/typed-binary/tree/master

const entity = z.string().describe('');
const entityId = z.union([z.bigint(), z.string()]);
export const cmdId = z.bigint().describe(
  'Recommended: supply a meaningful idempotency key as the command id',
);
const idempotentPeriodHours = numZod.Ui16;
const input = transferableRecord;
const maxRuns = numZod.Ui8;
const metadata = transferableRecord;
const name = z.string();
const parentCommandId = z.bigint();
const runAfter = z.number();
const runCooldownMs = numZod.Ui8;
const runTimeoutSeconds = numZod.Ui8;
const source = z.string();
export const decodedCommandMessage = z.strictObject({
  entity,
  entityId,
  id: cmdId,
  idempotentPeriodHours: idempotentPeriodHours.out,
  input,
  maxRuns: maxRuns.out,
  metadata,
  name,
  parentCommandId,
  runAfter,
  runCooldownMs: runCooldownMs.out,
  runTimeoutSeconds: runTimeoutSeconds.out,
  source,
}).required().brand('cmdMsg');
export type DecodedCommandMessage = z.infer<typeof decodedCommandMessage>;

export const encodedCommandId = z.bigint().describe('cmd: id');
export const encodedCommandMessage = z.tuple([
  z.instanceof(ArrayBuffer).describe(
    'Buffer storing maxRuns, runCooldownMs, runTimeoutSeconds, and idempotentPeriodHours',
  ),
  entity,
  entityId,
  cmdId,
  input,
  metadata,
  name,
  parentCommandId,
  runAfter,
  source,
]);
export type EncodedCommandMessage = z.infer<typeof encodedCommandMessage>;
export const commandMessageCodec = z.codec(encodedCommandMessage, decodedCommandMessage, {
  decode: (
    [buf, entity, entityId, id, input, metadata, name, parentCommandId, runAfter, source],
  ) => {
    const ui8s = newUint8Tuple(buf, 0, 3);
    const ui16 = newUint16Tuple(buf, 3, 1);

    return decodedCommandMessage.parse({
      maxRuns: numZod.Ui8.decode(ui8s[0]),
      runCooldownMs: numZod.Ui8.decode(ui8s[1]),
      runTimeoutSeconds: numZod.Ui8.decode(ui8s[2]),
      idempotentPeriodHours: numZod.Ui16.decode(ui16[0]),
      entity,
      entityId,
      id,
      input,
      metadata,
      name,
      parentCommandId,
      runAfter,
      source,
    });
  },
  encode: (msg): EncodedCommandMessage => {
    const keysSorted = decodedCommandMessage.def.shape.idempotentPeriodHours._zod.def.innerType;
    const buf = new ArrayBuffer(5);
    new Uint8Array(buf, 0, 3).set([
      msg.maxRuns ?? -1,
      msg.runCooldownMs ?? -1,
      msg.runTimeoutSeconds ?? -1,
    ]);
    new Uint16Array(buf, 3, 1).set([msg.idempotentPeriodHours ?? -1]);
    return [
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
  },
});
