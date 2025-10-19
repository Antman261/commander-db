import type { Numerics } from '../util/Numeric/Numerics.ts';
import type { Struct } from './struct.ts';

type StructMap<K extends StructValue, V extends StructValue> = Map<K, V>;
type StructArray<V extends StructValue> = Array<V>;
type StructSet<V extends StructValue> = Set<V>;
export type StructCollection = StructArray<any> | StructSet<any> | StructMap<any, any> | Struct;

type StructPrimitive = Transferable | Numerics;
export type StructValue = StructPrimitive | StructCollection;
