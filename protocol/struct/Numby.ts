import z from '@zod/zod';
import { binaryRegistry } from './binarySchemaRegistry.ts';
import { mergeObjects } from './mergeObjects.ts';

type TypedArray =
  | Uint8Array<ArrayBuffer>
  | Int8Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Int16Array<ArrayBuffer>
  | Uint32Array<ArrayBuffer>
  | Int32Array<ArrayBuffer>;
const STORAGE_TYPES = {
  Ui8: Uint8Array,
  Ui16: Uint16Array,
  Ui32: Uint32Array,
  Si8: Int8Array,
  Si16: Int16Array,
  Si32: Int32Array,
} as const;
type StorageInst = {
  Ui8: Uint8Array<ArrayBuffer>;
  Ui16: Uint16Array<ArrayBuffer>;
  Ui32: Uint32Array<ArrayBuffer>;
  Si8: Int8Array<ArrayBuffer>;
  Si16: Int16Array<ArrayBuffer>;
  Si32: Int32Array<ArrayBuffer>;
};
type StorageInstK = keyof StorageInst;
const encodeSymbol = Symbol('encodeMethod:numZod');

export const ui8 = mergeObjects(
  z.codec(
    z.instanceof(Uint8Array),
    z.custom<NumBase<StorageInst['Ui8']>>(),
    {
      decode: (ta) => newNumeric<StorageInst['Ui8']>(ta, 0),
      encode: (n) => n[encodeSymbol](),
    },
  ).register(binaryRegistry, { id: 'Ui8', byteLength: 1 }),
  { init: (v: number) => newNumeric(new Uint8Array([v]), 0) },
);
export const ui16 = mergeObjects(
  z.codec(
    z.instanceof(Uint16Array),
    z.custom<NumBase<StorageInst['Ui16']>>(),
    {
      decode: (ta) => newNumeric<StorageInst['Ui16']>(ta, 0),
      encode: (n) => n[encodeSymbol](),
    },
  ).register(binaryRegistry, { id: 'Ui16', byteLength: 2 }),
  { init: (v: number) => newNumeric(new Uint16Array([v]), 0) },
);
export const ui32 = mergeObjects(
  z.codec(
    z.instanceof(Uint32Array),
    z.custom<NumBase<StorageInst['Ui32']>>(),
    {
      decode: (ta) => newNumeric<StorageInst['Ui32']>(ta, 0),
      encode: (n) => n[encodeSymbol](),
    },
  ).register(binaryRegistry, { id: 'Ui32', byteLength: 4 }),
  { init: (v: number) => newNumeric(new Uint32Array([v]), 0) },
);
export const si8 = mergeObjects(
  z.codec(z.instanceof(Int8Array), z.custom<NumBase<StorageInst['Si8']>>(), {
    decode: (ta) => newNumeric<StorageInst['Si8']>(ta, 0),
    encode: (n) => n[encodeSymbol](),
  }).register(binaryRegistry, { id: 'Si8', byteLength: 1 }),
  { init: (v: number) => newNumeric(new Int8Array([v]), 0) },
);
export const si16 = mergeObjects(
  z.codec(
    z.instanceof(Int16Array),
    z.custom<NumBase<StorageInst['Si16']>>(),
    {
      decode: (ta) => newNumeric<StorageInst['Si16']>(ta, 0),
      encode: (n) => n[encodeSymbol](),
    },
  ).register(binaryRegistry, { id: 'Si16', byteLength: 2 }),
  { init: (v: number) => newNumeric(new Int16Array([v]), 0) },
);
export const si32 = mergeObjects(
  z.codec(
    z.instanceof(Int32Array),
    z.custom<NumBase<StorageInst['Si32']>>().brand('Si32'),
    {
      decode: (ta) => newNumeric<StorageInst['Si32']>(ta, 0),
      encode: (n) => n[encodeSymbol](),
    },
  ).register(binaryRegistry, { id: 'Si32', byteLength: 4 }),
  { init: (v: number) => newNumeric(new Int32Array([v]), 0) },
);
export const newNumBinTuple =
  <T extends StorageInstK>(kind: T extends StorageInstK ? T : never) =>
  (buf: ArrayBuffer, byteOffset: number, length: number): Array<
    StorageInst[
      T
    ]
  > => {
    const _view = new STORAGE_TYPES[kind](buf, byteOffset, length);
    return Array.from({ length }, (_, idx) => _view.subarray(idx, idx + 1)) as Array<StorageInst[T]>;
  };
export const newUint8Tuple = newNumBinTuple('Ui8');
export const newUint16Tuple = newNumBinTuple('Ui16');

type NumBase<T extends TypedArray = TypedArray> = number & {
  set(v: number): NumBase<T>;
  valueOf(): number;
  [encodeSymbol](): T;
};
export type Ui8 = z.infer<typeof ui8>;
export type Ui16 = z.infer<typeof ui16>;
export type Ui32 = z.infer<typeof ui32>;
export type Si8 = z.infer<typeof si8>;
export type Si16 = z.infer<typeof si16>;
export type Si32 = z.infer<typeof si32>;
export type Num = Ui8 | Ui16 | Ui32 | Si8 | Si16 | Si32;
const newNumeric = <T extends TypedArray>(_v: T, idx: number): NumBase<T> =>
  ({
    set(v: number) {
      _v[idx] = v;
      return this;
    },
    valueOf() {
      return _v[idx];
    },
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
      if (hint === 'number') {
        return _v[idx];
      }
      return _v[idx];
    },
    [encodeSymbol]: () => _v,
  }) as unknown as NumBase<T>;
