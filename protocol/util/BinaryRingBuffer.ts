import { UInt } from './Numeric/mod.ts';

/**
 * A fixed-sized ring buffer for binary data
 */
export class BinaryRingBuffer {
  #maxBytes: number;
  #dataStore: Uint8Array;
  #writePos: UInt;
  #readPos: UInt;
  /**
   * @constructor
   * @param maxBytes Maximum number of bytes the buffer can hold.
   */
  constructor(maxBytes: number) {
    this.#maxBytes = maxBytes;
    this.#dataStore = new Uint8Array(maxBytes);
    const positionBuffer = new Uint8Array(8).buffer;
    this.#writePos = new UInt(0, positionBuffer);
    this.#readPos = new UInt(0, positionBuffer, 4);
  }
  /**
   * Number of writable bytes before the write cursor returns to index 0.
   *
   * Returns -1 if the write cursor will collide with the read cursor before the end of the buffer
   */
  get #untilWriteWrap(): number {
    return +this.#writePos < +this.#readPos ? -1 : this.#maxBytes - +this.#writePos;
  }
  /**
   * Number of readable bytes before the read cursor returns to index 0.
   */
  get #untilReadWrap(): number {
    return +this.#readPos > +this.#writePos ? this.#maxBytes - +this.#readPos : -1;
  }
  /**
   * Number of bytes available for writing
   */
  get writable(): number {
    return +this.#writePos > +this.#readPos
      ? (this.#maxBytes - +this.#writePos) + +this.#readPos
      : (+this.#writePos === +this.#readPos ? this.#maxBytes : +this.#readPos - +this.#writePos);
  }

  /**
   * Number of bytes available for reading
   */
  get readable(): number {
    return +this.#writePos >= +this.#readPos
      ? +this.#writePos - +this.#readPos
      : (this.#maxBytes - +this.#readPos) + +this.#writePos;
  }
  #append(data: Uint8Array): void {
    this.#dataStore.set(data, +this.#writePos);
    this.#writePos.value = (+this.#writePos + data.byteLength) % (this.#maxBytes);
  }
  #shift(byteLength: number): Uint8Array {
    const result = this.#dataStore.subarray(+this.#readPos, +this.#readPos + byteLength);
    this.#readPos.value = (+this.#readPos + byteLength) % this.#maxBytes;
    return result;
  }

  /**
   * Write the provided data to the circular buffer.
   *
   * Throws if insufficient space available
   */
  write(data: Uint8Array): void {
    if (data.byteLength > this.writable) throw new Error('Circular buffer out of space');
    if (this.#untilWriteWrap === -1) return this.#append(data);
    if (data.byteLength <= this.#untilWriteWrap) return this.#append(data);
    //     w     r        w
    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const writeWrap = this.#untilWriteWrap;
    this.#append(data.subarray(0, writeWrap));
    this.#append(data.subarray(writeWrap));
  }
  /**
   * Read from the circular buffer. Once bytes are read they become writable and cannot be read again.
   * @param byteLength Number of bytes to read
   * @returns Binary data in a Uint8Array
   */
  read(byteLength = this.readable): Uint8Array {
    if (byteLength > this.readable) throw new Error('Insufficient readable data available');
    if (this.#untilReadWrap === -1) return new Uint8Array(this.#shift(byteLength));
    if (byteLength <= this.#untilReadWrap) return new Uint8Array(this.#shift(byteLength));
    const result = new Uint8Array(byteLength);
    const bytesBeforeWrap = this.#untilReadWrap;
    result.set(this.#shift(bytesBeforeWrap));
    result.set(this.#shift(byteLength - bytesBeforeWrap), bytesBeforeWrap);
    return result;
  }
  toString() {
  }
  toValue() {
    return this.toString();
  }
  get [Symbol.toStringTag]() {
    return `{
  maxBytes: ${this.#maxBytes}
  writable: ${this.writable}
  writePos: ${this.#writePos}
  untilWriteWrap: ${this.#untilWriteWrap}
  readable: ${this.readable}
  readPos: ${this.#readPos}
  untilReadWrap: ${this.#untilReadWrap}
}`;
  }
}
