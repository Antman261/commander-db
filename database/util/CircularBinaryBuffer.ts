/**
 * A circular buffer providing access to data views tracking the current start position
 */
export class CircularBinaryBuffer {
  #maxBytes: number;
  #dataStore: Uint8Array;
  #positionStore: Uint8Array;
  #endPosView: Uint32Array;
  #startPosView: Uint32Array;
  /**
   * @constructor
   * @param maxBytes The maximum number of bytes the buffer can hold.
   */
  constructor(maxBytes: number) {
    this.#maxBytes = maxBytes;
    this.#dataStore = new Uint8Array(maxBytes);
    this.#positionStore = new Uint8Array(8);
    this.#endPosView = new Uint32Array(this.#positionStore.buffer, 0, 1);
    this.#startPosView = new Uint32Array(this.#positionStore.buffer, 4, 1);
  }
  get #writePos(): number {
    return this.#endPosView[0];
  }
  // deno-lint-ignore explicit-function-return-type
  set #writePos(value: number) {
    this.#endPosView[0] = value;
  }
  get #readPos(): number {
    return this.#startPosView[0];
  }
  // deno-lint-ignore explicit-function-return-type
  set #readPos(value: number) {
    this.#startPosView[0] = value;
  }
  get #untilWriteWrap(): number {
    return this.#writePos > this.#readPos ? this.#maxBytes - this.#writePos : -1;
  }
  get #untilReadWrap(): number {
    return this.#readPos > this.#writePos ? this.#maxBytes - this.#readPos : -1;
  }
  /**
   * Number of bytes available for writing
   */
  get writable(): number {
    return this.#writePos > this.#readPos
      ? (this.#maxBytes - this.#writePos) + this.#readPos
      : (this.#writePos === this.#readPos ? this.#maxBytes : this.#readPos - this.#writePos);
  }

  /**
   * Number of bytes available for reading
   */
  get readable(): number {
    return this.#writePos >= this.#readPos
      ? this.#writePos - this.#readPos
      : (this.#maxBytes - this.#readPos) + this.#writePos;
  }
  #append(data: Uint8Array): void {
    this.#dataStore.set(data, this.#writePos);
    this.#writePos = (this.#writePos + data.byteLength) % this.#maxBytes;
  }
  #shift(byteLength: number): Uint8Array {
    const result = this.#dataStore.subarray(this.#readPos, this.#readPos + byteLength);
    this.#readPos = (this.#readPos + byteLength) % this.#maxBytes;
    return result;
  }

  /**
   * Write the provided data to the circular buffer.
   *
   * Will throw if insufficient space available
   */
  write(data: Uint8Array): void {
    if (data.byteLength > this.writable) throw new Error('Circular buffer out of space');
    if (this.#untilWriteWrap === -1) return this.#append(data);
    //     w     r        w
    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    this.#append(data.subarray(0, this.#untilWriteWrap));
    this.#append(data.subarray(this.#untilWriteWrap));
    this.#writePos = (this.#writePos + data.byteLength) % this.#maxBytes;
  }
  /**
   * Read from the circular buffer
   * @param byteLength
   * @param markRead
   * @returns
   */
  read(byteLength = this.readable): Uint8Array {
    if (byteLength > this.readable) throw new Error('Insufficient readable data available');
    if (this.#untilReadWrap === -1) return this.#shift(byteLength);
    const result = new Uint8Array(byteLength);
    const bytesBeforeWrap = this.#untilReadWrap;
    result.set(this.#shift(bytesBeforeWrap));
    result.set(this.#shift(byteLength - bytesBeforeWrap), bytesBeforeWrap);
    return result;
  }
}
