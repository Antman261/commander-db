import { z } from '@zod/zod';

// All hail the mighty structured clone algorithm, we weep in grand beneficence: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

export type Primitive = z.infer<typeof transferablePrimitive>;
export const transferablePrimitive = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.bigint(),
  z.null(),
  z.undefined(), //
]);
export const transferableTypedArray = z.union([
  z.instanceof(Uint8Array),
  z.instanceof(Uint16Array),
  z.instanceof(Uint32Array),
  z.instanceof(BigUint64Array),
  z.instanceof(Int8Array),
  z.instanceof(Int16Array),
  z.instanceof(Int32Array),
  z.instanceof(BigInt64Array),
  z.instanceof(Float16Array),
  z.instanceof(Float32Array),
  z.instanceof(Float64Array),
]);
export type TypedArray = z.infer<typeof transferableTypedArray>;
export const transferableClasses = z.union([
  z.instanceof(RegExp),
  z.date(),
  z.instanceof(DataView),
  z.instanceof(Error),
  z.instanceof(ArrayBuffer),
]);
export type TransferableClasses = RegExp | DataView | Error | ArrayBuffer | Date;
export type TransferableSet = Set<CdbTransferable>;
export type TransferableMap = Map<CdbTransferable, CdbTransferable>;
export type TransferableRecord = { [key: string]: CdbTransferable };
export const transferableSet = z.custom<TransferableSet>((v) => v instanceof Set);
export const transferableMap = z.custom<TransferableMap>((v) => v instanceof Map);
export const transferableRecord = z.custom<TransferableRecord>((v) =>
  typeof v === 'object' && Array.isArray(v) === false
);
export const transferable = z.union([
  ...transferableClasses.options,
  ...transferableTypedArray.options,
  ...transferablePrimitive.options,
  transferableMap,
  transferableSet,
  transferableRecord,
]);
export type CdbTransferable =
  | Primitive
  | TypedArray
  | TransferableClasses
  | TransferableSet
  | TransferableMap
  | TransferableRecord;
