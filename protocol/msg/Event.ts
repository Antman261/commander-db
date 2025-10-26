import { z } from '@zod/zod';
import { transferableRecord } from '@proto/struct';

export type Event = z.infer<typeof decodedEvents>;

export const encodedEvents = z.tuple([
  z.bigint().describe('event: .id'),
  z.bigint().describe('event: cmdId'),
  z.record(z.string(), z.unknown()).describe('event: metadata'),
  transferableRecord,
]).array();
export type EncodedEvent = z.infer<typeof encodedEvents>;
export const decodedEvents = z.strictObject({
  id: z.bigint(),
  cmdId: z.bigint(),
  payload: transferableRecord,
  metadata: z.record(z.string(), z.unknown()),
}).array();
export const eventCodec = z.codec(encodedEvents, decodedEvents, {
  encode: (m): EncodedEvent => m.map((de) => [de.id, de.cmdId, de.metadata, de.payload]),
  decode: (m) => m.map((ee) => ({ id: ee[0], cmdId: ee[1], metadata: ee[2], payload: ee[3] })),
});
export type InputEvent = Omit<Event, 'id' | 'cmdId'>;
