const STORAGE_TYPES = {
  UTinyInt: Uint8Array,
  STinyInt: Int8Array,
  USmallInt: Uint16Array,
  SSmallInt: Int16Array,
  UInt: Uint32Array,
  SInt: Int32Array,
  // todo: bigints better to handle separately
  // UBigInt: BigUint64Array,
  // SBigInt: BigInt64Array,
} as const;

type StorageTypes = typeof STORAGE_TYPES;

export class Numeric<T extends keyof StorageTypes> {
  /** @private Underlying data view  */
  _v: InstanceType<StorageTypes[T]>;
  /** Numeric type */
  _t: keyof StorageTypes;
  constructor(num: number, storageType: T, buffer?: ArrayBuffer, offset: number = 0) {
    this._t = storageType;
    const storeType = STORAGE_TYPES[storageType];
    buffer
      ? this._v = new storeType(buffer, offset, 1) as InstanceType<StorageTypes[T]>
      : this._v = new storeType(1) as InstanceType<StorageTypes[T]>;
    this._v[0] = num;
  }
  /**
   * Number of bytes used to store the numeric
   */
  get size(): number {
    return this._v.BYTES_PER_ELEMENT;
  }
  /**
   * The underlying array buffer
   */
  get buffer(): ArrayBuffer {
    return this._v.buffer;
  }
  get value() {
    return this._v[0];
  }
  set value(v: number) {
    this._v[0] = v;
  }
  set(v: number) {
    this._v[0] = v;
  }
  valueOf() {
    return this._v[0];
  }
  [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
    if (hint === 'number') {
      return this._v[0];
    }
    return this._v[0];
  }
  setViaBinary(buf: Uint8Array): void {
    this._v[0] = new Uint32Array(this.buffer, buf.byteOffset, buf.byteLength / this.size)[0];
  }
  toBinary() {
    return new Uint8Array(this._v.buffer, 0, this.size);
  }
}
