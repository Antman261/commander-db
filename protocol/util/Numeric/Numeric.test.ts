import { expect } from 'jsr:@std/expect';
import { UInt } from './Numerics.ts';

Deno.test('UInt', async ({ step }) => {
  await step('usable with arithmetic', () => {
    const h = new UInt(3);
    expect(+h).toEqual(3);
    expect(+h + 3).toEqual(6);
    h.value = 6 + +h + +h;
    expect(+h).toEqual(12);
    expect(h.value).toEqual(12);
  });
  await step('correctly report size', () => {
    const n = new UInt(1000);
    expect(UInt.bytes).toEqual(4);
    expect(n.size).toEqual(4);
  });
  await step('does not work with out-of-range numbers', () => {
    expect(new UInt(-1000).value).toEqual(4294966296);
    expect(new UInt(Number.MAX_SAFE_INTEGER).value).toEqual(4294967295);
  });
  await step('correctly uses provided buffer', () => {
    const dataBuffer = new Uint8Array(8);
    const a = new UInt(1_001, dataBuffer.buffer, 4);
    const b = new UInt(65_800, dataBuffer.buffer);
    expect(dataBuffer.values().toArray()).toEqual([8, 1, 1, 0, 233, 3, 0, 0]);
    a.value = 123;
    expect(dataBuffer.values().toArray()).toEqual([8, 1, 1, 0, 123, 0, 0, 0]);
    b.value = 258000;
    expect(dataBuffer.values().toArray()).toEqual([208, 239, 3, 0, 123, 0, 0, 0]);
  });
});
