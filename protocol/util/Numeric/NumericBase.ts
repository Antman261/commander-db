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
  protected _value: InstanceType<StorageTypes[T]>;
  constructor(num: number, storageType: T, buffer?: ArrayBuffer, offset: number = 0) {
    const storeType = STORAGE_TYPES[storageType];
    buffer
      ? this._value = new storeType(buffer, offset, 1) as InstanceType<StorageTypes[T]>
      : this._value = new storeType(1) as InstanceType<StorageTypes[T]>;
    this._value[0] = num;
  }
  /**
   * Number of bytes used to store the numeric
   */
  get size(): number {
    return this._value.BYTES_PER_ELEMENT;
  }
  /**
   * The underlying array buffer
   */
  get buffer(): ArrayBuffer {
    return this._value.buffer;
  }
  get value() {
    return this._value[0];
  }
  set value(v: number) {
    this._value[0] = v;
  }
  set(v: number) {
    this._value[0] = v;
  }
  valueOf() {
    return this._value[0];
  }
  [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
    if (hint === 'number') {
      return this._value[0];
    }
    return this._value[0];
  }
  setViaBinary(buf: Uint8Array): void {
    this._value[0] = new Uint32Array(this.buffer, buf.byteOffset, buf.byteLength / this.size)[0];
  }
  toBinary() {
    return new Uint8Array(this._value.buffer, 0, this.size);
  }
}
