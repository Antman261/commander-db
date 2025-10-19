import type { Obj } from '@antman/formic-utils';

// All hail the mighty structured clone algorithm, we weep in grand beneficence: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

export type Primitive = boolean | number | string | bigint | null | undefined;
export type STransferable = Primitive | TypedArray | RegExp | Date | DataView | Error | ArrayBuffer | Obj;
export type TypedArray =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Float16Array
  | Float32Array
  | Float64Array;
