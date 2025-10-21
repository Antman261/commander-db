import {
  _infer,
  _type,
  SArray,
  SArrayBuffer,
  type SBigint,
  SBoolean,
  SDataView,
  SDate,
  SError,
  SInfer,
  SMap,
  SNumber,
  SObject,
  SOptional,
  SRegExp,
  SSet,
  SSInt16,
  SSInt32,
  SSInt8,
  SString,
  SType,
  SUInt16,
  SUInt32,
  SUInt8,
  SUndefined,
  SValue,
} from './STypeMap.ts';
import { STransferable } from './Transferable.ts';

export const HeaderTag = {
  bool: 0, // Boolic
  numeric: 1, // Numeric
  arr: 2, // StructArraym
  set: 3, // StructSet
  map: 4, // StructMap
} as const;

type Test = SInfer<SBoolean>;

// const defineValue = <T = SType>(k: T) => {
//   return <A extends STransferable = STransferable, B extends STransferable = STransferable>(): T extends SType
//     ? (STypeDef<A, B>)[T]
//     : never => ({
//       t: k,
//       // optional: () => ({ t: k }),
//       infers: undefined as unknown as T extends SType ? STypeOut<A, B>[T] : never,
//     });
// };

// type StructType = {[key: SType]: }
const defineValue = <V = SValue, T = SType>(
  t: T extends SType ? T : never,
): <A extends STransferable = STransferable, B extends STransferable = STransferable>() => V =>
<A extends STransferable = STransferable, B extends STransferable = STransferable>(): V extends SValue<A, B>
  ? V
  : never =>
  ({
    [_type]: t,
    [_infer]: undefined as unknown as SInfer<V extends SValue ? V : never>,
    optional: () =>
      ({
        [_type]: `?${t}`,
        [_infer]: undefined as unknown as (SInfer<V extends SValue ? V : never> | undefined),
      }) as SOptional<T extends SType ? T : never, A, B>,
  }) as unknown as V extends SValue<A, B> ? V : never;
export const s = {
  bool: defineValue<SBoolean>('bool'),
  number: defineValue<SNumber>('number'),
  bigint: defineValue<SBigint>('bigint'),
  string: defineValue<SString>('string'),
  undefined: defineValue<SUndefined>('undefined'),
  RegExp: defineValue<SRegExp>('RegExp'),
  Date: defineValue<SDate>('Date'),
  Object: defineValue<SObject>('Object'),
  Array: defineValue<SArray>('Array'),
  Map: defineValue<SMap>('map'),
  Set: defineValue<SSet>('set'),
  ArrayBuffer: defineValue<SArrayBuffer>('ArrayBuffer'),
  Error: defineValue<SError>('Error'),
  DataView: defineValue<SDataView>('DataView'),
  UInt8: defineValue<SUInt8>('UInt8'),
  UInt16: defineValue<SUInt16>('UInt16'),
  UInt32: defineValue<SUInt32>('UInt32'),
  SInt8: defineValue<SSInt8>('SInt8'),
  SInt16: defineValue<SSInt16>('SInt16'),
  SInt32: defineValue<SSInt32>('SInt32'),
} as const;
//
// %
//
//
