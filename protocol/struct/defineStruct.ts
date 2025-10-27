import { commandMessageCodec, decodedCommandMessage } from '@proto/msg';
import { z } from '@zod/zod';
import * as z4 from '@zod/zod/v4/core';
import { ui16 } from './Numby.ts';
import { binaryRegistry, RegistryEntry } from './binarySchemaRegistry.ts';
import { sortBy } from '@proto/util';
export const binaryObject = <T extends z.ZodObject>(codec: T) => {
  // const binaryEntries: RegistryEntry[] = [];
  const byteLengths: number[] = [];
  let byteLength = 0;
  const entries = Object.entries(codec).sort(sortBy(0));
  for (const [_key, val] of entries) {
    const entry = binaryRegistry.get(val);
    if (entry) {
      byteLengths.push(entry.byteLength);
      byteLength += entry.byteLength;
    }
  }

  return (_inits: Parameters<T['encode']>[0]) => {
    const buffer = new ArrayBuffer(byteLength);
    const dataView = new DataView(buffer);
    for (let idx = 0; idx < entries.length; idx++) {
      const [_key, val] = entries[idx];
    }
  };
};
const initCommandMessage = binaryObject(decodedCommandMessage);
initCommandMessage({
  runCooldownMs: '',
  runTimeoutSeconds: '',
  idempotentPeriodHours: ui16.init(0),
  entity: '',
  entityId: '',
  id: '',
  input: '',
  metadata: '',
  name: '',
  parentCommandId: '',
  runAfter: '',
  source: '',
});
