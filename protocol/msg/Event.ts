import type { Obj, ObjWide } from './Obj.ts';

export type Event = { id: bigint; metadata: ObjWide; cmdId: bigint } & Obj;
export type PotentialEvent = Omit<Event, 'id' | 'cmdId'>;
