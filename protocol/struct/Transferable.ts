import { z } from '@zod/zod';

// All hail the mighty structured clone algorithm, we weep in grand beneficence: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

export type Primitive = z.infer<typeof xfrPrimitive>;
export const xfrPrimitive = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.bigint(),
  z.null(),
  z.undefined(),
]);
export const xfrTypedArray = z.union([
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
export type TypedArray = z.infer<typeof xfrTypedArray>;
export const xfrClass = z.union([
  z.instanceof(RegExp),
  z.date(),
  z.instanceof(DataView),
  z.instanceof(Error),
  z.instanceof(ArrayBuffer),
]);
export type TransferableClasses = z.infer<typeof xfrClass>;
export const xfrSet: z.ZodType<Set<STransferable>> = z.set(z.lazy(() => transferable));
export const xfrMap: z.ZodType<Map<STransferable, STransferable>> = z.map(
  z.lazy(() => transferable),
  z.lazy(() => transferable),
);
export const xfrRecord: z.ZodType<{ [key: string]: STransferable }> = z.object().catchall(
  z.lazy(() => transferable),
);
export const transferable: z.ZodType<STransferable> = z.union([
  xfrClass,
  xfrTypedArray,
  xfrPrimitive,
  // z.lazy(() => z.union([xfrSet, xfrMap, xfrRecord])),
]);
export type STransferable =
  | Primitive
  | TypedArray
  | TransferableClasses
  | { [key: string]: STransferable };
