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
    expect(n.size).toEqual(4);
  });
  await step('does not work with out-of-range numbers', () => {
    expect(new UInt(-1000).value).toEqual(4294966296);
    expect(new UInt(Number.MAX_SAFE_INTEGER).value).toEqual(4294967295);
  });
});
