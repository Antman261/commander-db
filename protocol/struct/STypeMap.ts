import type { SInt16, SInt32, SInt8, UInt16, UInt32, UInt8 } from '../util/Numeric/Numerics.ts';
import type { Struct } from './struct.ts';
import { StructValue } from './StructValue.ts';
import { STransferable } from './Transferable.ts';

export type SType =
  | 'bool'
  | 'number'
  | 'bigint'
  | 'string'
  | 'undefined'
  | 'RegExp'
  | 'Date'
  | 'Object'
  | 'Array'
  // | 'tuple'
  | 'map'
  | 'set'
  | 'ArrayBuffer'
  | 'Error'
  | 'DataView'
  // | 'StructEnum'
  | 'UInt8'
  | 'SInt8'
  | 'UInt16'
  | 'SInt16'
  | 'UInt32'
  | 'SInt32';
// | 'StructArray'
// | 'StructMap'
// | 'StructSet';
// | 'Struct';
export type STypeOut<A = unknown, B = unknown> = {
  bool: boolean;
  number: number;
  bigint: bigint;
  string: string;
  undefined: undefined;
  RegExp: RegExp;
  Date: Date;
  Object: Record<string, Transferable>;
  Array: Array<A>;
  // tuple: [A, B];
  map: Map<A, B>;
  set: Set<A>;
  ArrayBuffer: ArrayBuffer;
  Error: Error;
  DataView: DataView;
  // StructEnum: StructEnum<A>;
  UInt8: UInt8;
  SInt8: SInt8;
  UInt16: UInt16;
  SInt16: SInt16;
  UInt32: UInt32;
  SInt32: SInt32;
  // StructArray: StructArray<A>;
  // StructMap: StructMap<A, B>;
  // StructSet: StructSet<A>;
  // Struct: Struct<A>;
};
export type STypeIn<A extends Transferable = Transferable, B extends Transferable = Transferable> = {
  bool: SBoolean;
  number: SNumber;
  bigint: SBigint;
  string: SString;
  undefined: SUndefined;
  RegExp: SRegExp;
  Date: SDate;
  Object: SObject;
  Array: SArray<A>;
  // tuple: [A, B];
  map: SMap<A, B>;
  set: SSet<A>;
  ArrayBuffer: SArrayBuffer;
  Error: SError;
  DataView: SDataView;
  // StructEnum: SStructEnum<A>;
  UInt8: SUInt8;
  SInt8: SSInt8;
  UInt16: SUInt16;
  SInt16: SSInt16;
  UInt32: SUInt32;
  SInt32: SSInt32;
  // StructArray: SStructArray<A>;
  // StructMap: SStructMap<A, B>;
  // StructSet: SStructSet<A>;
  // Struct: SStruct<A>;
};
export const _type = Symbol('type');
export const _infer = Symbol('infer');
export type STypeDef<T extends SType, A = any, B = any> = {
  [_type]: T;
  [_infer]: STypeOut<A, B>[T];
  optional(): SOptional<T, A, B>;
};
export type SOptional<T extends SType, A = unknown, B = unknown> = {
  [_type]: `?${T}`;
  [_infer]: STypeOut<A, B>[T] | undefined;
};
export type SInfer<T extends STypeDef<SType>> = T[typeof _infer];

export type SBoolean = STypeDef<'bool'>;
export type SNumber = STypeDef<'number'>;
export type SBigint = STypeDef<'bigint'>;
export type SString = STypeDef<'string'>;
export type SUndefined = STypeDef<'undefined'>;
export type SRegExp = STypeDef<'RegExp'>;
export type SDate = STypeDef<'Date'>;
export type SObject = STypeDef<'Object'>;
export type SArray<T extends STransferable = STransferable> = STypeDef<'Array', T>;
export type SMap<K extends STransferable = STransferable, V extends STransferable = STransferable> = STypeDef<
  'map',
  K,
  V
>;
export type SSet<V extends STransferable = STransferable> = STypeDef<'set', V>;
export type SArrayBuffer = STypeDef<'ArrayBuffer'>;
export type SError = STypeDef<'Error'>;
export type SDataView = STypeDef<'DataView'>;
export type SUInt8 = STypeDef<'UInt8'>;
export type SUInt16 = STypeDef<'UInt16'>;
export type SUInt32 = STypeDef<'UInt32'>;
export type SSInt8 = STypeDef<'SInt8'>;
export type SSInt16 = STypeDef<'SInt16'>;
export type SSInt32 = STypeDef<'SInt32'>;
export type SStructEnum<K extends string[]> = STypeDef<'StructEnum', K>;
export type SStructArray<V extends STransferable = STransferable> = STypeDef<'StructArray', V>;
export type SStructMap<K extends STransferable = STransferable, V extends STransferable = STransferable> =
  STypeDef<'StructMap', K, V>;
export type SStructSet<V extends STransferable = STransferable> = STypeDef<'StructSet', V>;
export type SStruct<C extends Record<string, StructValue>> = STypeDef<'Struct', C>;

export type SValue<A extends STransferable = STransferable, B extends STransferable = STransferable> =
  | SBoolean
  | SNumber
  | SBigint
  | SString
  | SUndefined
  | SRegExp
  | SDate
  | SObject
  | SArray<A>
  | SMap<A, B>
  | SSet<A>
  | SArrayBuffer
  | SError
  | SDataView
  // | SStructEnum
  | SUInt8
  | SUInt16
  | SUInt32
  | SSInt8
  | SSInt16
  | SSInt32;
