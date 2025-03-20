import { decodeBase64 } from "jsr:@std/encoding";
import { expect } from "jsr:@std/expect";
import { Buffer } from "node:buffer";
import { deserialize, serialize } from "node:v8";

type ResultObject<T> = {
  serialized: ReturnType<typeof serialize>;
  deserialized: T;
};
const testSerializing = <T>(value: T): ResultObject<T> => ({
  serialized: serialize(value),
  deserialized: deserialize(serialize(value)),
});

/**
 * This test fails, proving we cannot use new-line character to detect end of message in a byte array
 */
Deno.test.ignore(
  "serialized values will not include new-line characters",
  async () => {
    const needle = Buffer.from([0x0A]);
    const value = "string with an escaped \n new line character";
    const result = testSerializing(value);
    console.log(result);
    expect(result.deserialized).toEqual(value);
    expect(result.serialized.includes(needle)).toBeFalsy();
  },
);

/**
 * This test proves we must base64 encode serialized objects for transmission over network.
 * This means be can compose stream transformers to process network messages
 */
Deno.test("encoding serialized values prevents new-line characters appearing in output", async () => {
  const needle = Buffer.from([0x0A]);
  const value = "string with an escaped \n new line character";
  const serialized = (serialize(value)).toString("base64");
  const deserialized = deserialize(Buffer.from(serialized, "base64"));
  console.log({ serialized, deserialized });
  console.log(deserialized);
  expect(deserialized).toEqual(value);
  expect(Buffer.from(serialized).includes(needle)).toBeFalsy();
});

/**
 * base64 encoding increases the size significantly, in many cases, depending on the data, it erodes improvements from serializing javascript objects to binary representations. However, have come up with a simple solution to safely transmit binary javascript objects
 */
Deno.test("encoding serialized objects result in smaller payloads than stringify to JSON", async () => {
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  interface BigInt {
    /** Convert to BigInt to string form in JSON.stringify */
    toJSON: () => string;
  }
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
  const testObject = {
    foo: "Some sort \nof string",
    obj: {
      num: 5,
    },
    bigiNum: 10156731269514113596n,
    bid: 10156731269514113596n,
    isFalse: false,
    arr: [true, true, false, 10, null, false, undefined, 0, -0],
  };
  const serializationData = serialize(testObject);
  const serializationText = serializationData.toString("base64");
  const serialized = serializationText;
  const stringifiedText = JSON.stringify(testObject);
  const stringifiedTextByteLength = Uint8Array.from(stringifiedText).byteLength;
  const encodedObjectByteLength = Uint8Array.from(serialized).byteLength;
  const serializedByteLength = serializationData.byteLength;

  await Deno.writeFile("test.bdat", serializationData);
  console.log({
    stringifiedTextByteLength,
    encodedObjectByteLength,
    serializedByteLength,
  });
  console.log({ stringifiedText });
  const deserializationText = decodeBase64(serialized);
  console.log({ serializationText });
  const deserialized = deserialize(deserializationText);
  expect(stringifiedTextByteLength).toBeGreaterThan(encodedObjectByteLength);
  expect(deserialized).toMatchObject(testObject);
});
