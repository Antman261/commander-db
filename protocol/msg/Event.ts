import { z } from '@zod/zod';
import type { Obj } from './Obj.ts';

export type Event = { id: bigint; metadata: Obj; cmdId: bigint } & Obj;

const encodedEvent = z.tuple([
  z.bigint().describe('event: .id'),
  z.bigint().describe('event: cmdId'),
  z.record(z.string(), z.unknown()).describe('event: metadata'),
  j,
]);
export type PotentialEvent = Omit<Event, 'id' | 'cmdId'>;
