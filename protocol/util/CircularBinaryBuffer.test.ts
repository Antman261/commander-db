import { expect } from 'jsr:@std/expect';
import { BinaryRingBuffer } from './CircularBinaryBuffer.ts';

Deno.test('CircularBinaryBuffer', async ({ step }) => {
  await step('can write a byte', async () => {
    const buf = new BinaryRingBuffer(128);
    expect(buf.writable).toEqual(128);
    buf.write(new Uint8Array([5]));
    expect(buf.writable).toEqual(127);
  });
  await step('can read a byte', async () => {
    const buf = new BinaryRingBuffer(128);
    expect(buf.readable, 'unwritten').toEqual(0);
    buf.write(new Uint8Array([5]));
    expect(buf.readable, 'readable after write').toEqual(1);
    expect(buf.read(1)[0], 'result').toEqual(5);
    expect(buf.readable, 'readable after read').toEqual(0);
  });
  await step('can read a subset of data', async () => {
    const buf = new BinaryRingBuffer(128);
    buf.write(new Uint8Array([5, 3, 7]));
    expect(buf.writable).toEqual(125);
    expect(buf.readable).toEqual(3);
    expect([...buf.read(2).values()], 'result').toEqual([5, 3]);
  });
  await step('regains writable bytes after reading ', async () => {
    const buf = new BinaryRingBuffer(128);
    buf.write(new Uint8Array([5, 3, 7, 3]));
    expect(buf.writable).toEqual(124);
    expect(buf.readable).toEqual(4);
    expect([...buf.read(2).values()], 'result').toEqual([5, 3]);
    expect(buf.readable).toEqual(2);
    expect(buf.writable).toEqual(126);
    expect([...buf.read(2).values()], 'result').toEqual([7, 3]);
    expect(buf.readable).toEqual(0);
    expect(buf.writable).toEqual(128);
  });
  await step('can read & write beyond wraparound', async () => {
    const buf = new BinaryRingBuffer(64);
    const data = new Uint8Array(32);
    new Uint32Array(data.buffer)[0] = 123456;
    buf.write(data); // 32 bytes written
    expect(buf.writable).toEqual(32);
    expect(buf.readable).toEqual(32);
    expect(new Uint32Array(buf.read(4).buffer)[0]).toEqual(123456);
    expect(buf.writable).toEqual(36);
    expect(buf.readable).toEqual(28);
    buf.read();
    new Uint16Array(data.buffer)[0] = 5678;
    new Uint16Array(data.buffer, 2)[0] = 123;
    buf.write(data.subarray(0, 2)); // 36 bytes written
    expect(buf.readable).toEqual(2);
    expect(new Uint16Array(buf.read(2).buffer)[0]).toEqual(5678);
    // expect(new Uint16Array(buf.read(2).buffer)[0]).toEqual(123);
    expect(buf.writable).toEqual(64);
    expect(buf.readable).toEqual(0);
    const numbers = [654_321, 76_598_321, 6_598_321, 598_321, 98_321, 8_321, 321, 21];
    numbers.forEach((num, idx) => {
      new Uint32Array(data.buffer, idx * 4, 1)[0] = num;
      expect(buf.writable).toEqual(64 - idx * 4);
      buf.write(data.subarray(idx * 4, (idx * 4) + 4));
    });
    expect(buf.writable).toEqual(32);
    expect(buf.readable).toEqual(32);
    numbers.forEach((num, idx) => {
      expect(buf.readable).toEqual(32 - idx * 4);
      const result = new Uint32Array(buf.read(4).buffer)[0];
      expect(result).toEqual(num);
    });
  });
});
