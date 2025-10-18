import { expect } from 'jsr:@std/expect';
import { UInt32, UInt8 } from './Numerics.ts';
import { deserialize, serialize } from 'node:v8';

Deno.test('UInt', async ({ step }) => {
  await step('usable with arithmetic', () => {
    const h = new UInt32(3);
    expect(+h).toEqual(3);
    expect(+h + 3).toEqual(6);
    h.value = 6 + +h + +h;
    expect(+h).toEqual(12);
    expect(h.value).toEqual(12);
  });
  await step('correctly report size', () => {
    const n = new UInt32(1000);
    expect(UInt32.bytes).toEqual(4);
    expect(n.size).toEqual(4);
  });
  await step('does not work with out-of-range numbers', () => {
    expect(new UInt32(-1000).value).toEqual(4294966296);
    expect(new UInt32(Number.MAX_SAFE_INTEGER).value).toEqual(4294967295);
  });
  await step('correctly uses provided buffer', () => {
    const dataBuffer = new Uint8Array(8);
    const a = new UInt32(1_001, dataBuffer.buffer, 4);
    const b = new UInt32(65_800, dataBuffer.buffer);
    expect(dataBuffer.values().toArray()).toEqual([8, 1, 1, 0, 233, 3, 0, 0]);
    a.value = 123;
    expect(dataBuffer.values().toArray()).toEqual([8, 1, 1, 0, 123, 0, 0, 0]);
    b.value = 258000;
    expect(dataBuffer.values().toArray()).toEqual([208, 239, 3, 0, 123, 0, 0, 0]);
  });
  await step('does arithmetic with single byte integer', () => {
    expect(new UInt8(5).value).toEqual(5);
  });
  await step('can be serialized and deserialized', () => {
    const reSerialized = deserialize(serialize(new UInt8(5)));
    console.log(reSerialized);
    // need js struct?
    expect(reSerialized.value).toEqual(5);
  });
});
