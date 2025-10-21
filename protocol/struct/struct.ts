import { sortBy, UInt16 } from '@proto/util';
import type { DryNumeric } from '../util/Numeric/NumericBase.ts';
import type { Primitive } from './Transferable.ts';
import type { StructValue } from './StructValue.ts';
import { s } from './tag.ts';

type DryStructValue =
  | Primitive
  | RegExp
  | DryNumeric<any>
  | DryStruct
  | Array<StructValue>
  | Map<StructValue, StructValue>
  | Set<StructValue>;
type StructData = { [key: string]: StructValue };
type StructInternal = {
  /** Buffer for numeric and bool data storage */
  __b: ArrayBuffer;
  /** Array of types in the buffer, matching the keys of the object in deterministic sort order */
  __t: Uint8Array<ArrayBuffer>;
};
export type Struct = StructInternal & StructData;
type DryStruct = StructInternal & {
  [key: string]: DryStructValue;
};

// type StructInit<Config extends StructConfig> = {
//   [key in keyof Config]: Config[key] extends Boolean?boolean: Config[key] extends Number?number: Config[key] extends String?string: Config[key] extends RegExp?RegExp: Config[key] extends Date?Date: Config[key] extends Object?Obj: Config[key] extends ? Array<unknown>: Config[key] extends ?Map<unknown, unknown>: never;
// };
type StructInitializer = <Config extends StructConfig, ReturnStruct extends Struct>(
  initValues: Config,
) => ReturnStruct;

const structRegistry: Record<string, StructInitializer> = {};

export const defineStruct = <Config extends StructConfig, ReturnStruct extends Struct>(
  name: string,
  cfg: Config,
): ReturnStruct => {
  const entries = Object.entries(cfg).sort(sortBy(0));
  const keys = entries.map(([k]) => k);
  const keyMap = keys.reduce<Record<string, number>>((p, c, i) => {
    p[c] = i;
    return p;
  }, {});
  if (structRegistry[name]) throw new Error(`Struct ${name} already defined`);
  const initializer;
  const dataBuffer = new ArrayBuffer();
  const headerLength = 2; // todo: Determine required header length, 2 is made up placeholder atm
  const header = new Uint8Array(dataBuffer, 0, headerLength);
  const struct: ReturnStruct = {
    __b: dataBuffer,
    __t: header,
    ...cfg,
  } as ReturnStruct;
  return struct;
};

export const hydrateStruct = (s: DryStruct): Struct => {
};

class StructArray<T extends StructValue> {
  constructor(kind: T);
}
type StructConfig = {
  [key: string]:
    | Boolean
    | Number
    | String
    | ArrayBuffer
    | UInt16
    | StructArray
    | StructMap
    | StructSet
    | Struct;
};
const myStruct = defineStruct('my-struct', {
  isBoolean: s.bool(),
  someNumber: Number,
  someBigint: BigInt,
  someString: String,
  someOptionalString: [String],
  someRegExp: RegExp,
  someDate: Date,
  someObject: Object,
  someArray: Array,
  someMap: Map,
  someSet: Set,
  someArrayBuffer: ArrayBuffer,
  sumError: Error,
  someDataView: DataView,
  someEnum: myStructEnum,
  someNumeric: UInt16,
  someStructArray: StructArray,
  someStructMap: StructMap,
  someStructSet: StructSet,
  someStruct: myStruct,
  anyStruct: Struct,
});
