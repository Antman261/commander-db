import { expect } from 'jsr:@std/expect';
import { Buffer } from 'node:buffer';
import { deserialize, serialize } from 'node:v8';

type ResultObject<T> = { serialized: ReturnType<typeof serialize>; deserialized: T };
const testSerializing = <T>(value: T): ResultObject<T> => ({
  serialized: serialize(value),
  deserialized: deserialize(serialize(value)),
});

/**
 * This test fails, proving we cannot use new-line character to detect end of message in a byte array
 */
Deno.test.ignore('serialized values will not include new-line characters', async () => {
  const needle = Buffer.from([0x0A]);
  const value = 'string with an escaped \n new line character';
  const result = testSerializing(value);
  console.log(result);
  expect(result.deserialized).toEqual(value);
  expect(result.serialized.includes(needle)).toBeFalsy();
});

/**
 * This test proves we must base64 encode serialized objects for transmission over network.
 * This means be can compose stream transformers to process network messages
 */
Deno.test('encoding serialized values prevents new-line characters appearing in output', async () => {
  const needle = Buffer.from([0x0A]);
  const value = 'string with an escaped \n new line character';
  const serialized = (serialize(value)).toString('base64');
  const deserialized = deserialize(Buffer.from(serialized, 'base64'));
  console.log({ serialized, deserialized });
  console.log(deserialized);
  expect(deserialized).toEqual(value);
  expect(Buffer.from(serialized).includes(needle)).toBeFalsy();
});
