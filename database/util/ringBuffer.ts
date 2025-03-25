type Opt = { size: number };
export class RingBuffer<T> {
  #size: number;
  #data: (T | undefined)[];
  #pos: number;
  constructor(opt: Opt) {
    this.#size = opt.size;
    this.#data = Array.from({ length: this.#size });
    this.#pos = 0;
  }
  add(v: T): void {
    this.#data[this.#pos] = v;
    this.#pos = (this.#pos + 1) % this.#size;
  }
  remove(v: T): void {
    this.#data[this.#data.indexOf(v)] = undefined;
  }
  values(): T[] {
    return this.#data.filter((v) => v !== undefined);
  }
}
