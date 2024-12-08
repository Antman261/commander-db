import { expect } from 'jsr:@std/expect';
import { deserialize, serialize } from 'node:v8';

const strings = {
  name: 'I_AM_A_SASQUATCH',
  type: 'FOOBAR',
  payload: {
    bars: ['beep', 12, 'boop', 19600050036729n, true],
    at: new Date(),
  },
};
const symbols = {
  [Symbol.for('name')]: 'I_AM_A_SASQUATCH',
  [Symbol.for('type')]: 'FOOBAR',
  [Symbol.for('payload')]: {
    [Symbol.for('bars')]: ['beep', 12, 'boop', 19600050036729n, true],
    [Symbol.for('at')]: new Date(),
  },
};

Deno.test('symbols are smaller than string literals', async () => {
  const result = {
    strings: serialize(strings),
    symbols: serialize(symbols),
  };
  console.log(result);
  expect(result.strings.byteLength).toBeGreaterThan(result.symbols.byteLength);
});
Deno.test(
  'serialized symbol-keyed objects cannot be deserialized',
  () => {
    const serial = {
      strings: serialize(strings),
      symbols: serialize(symbols),
    };
    const result = {
      strings: deserialize(serial.strings),
      symbols: deserialize(serial.symbols),
    };
    console.log(result);

    expect(result.symbols).toMatchObject({});
  },
);

Deno.test('numbers are smaller than bigint for small integers', () => {
  const serial = {
    number: serialize(52),
    bigint: serialize(52n),
  };
  const result = {
    number: deserialize(serial.number),
    bigint: deserialize(serial.bigint),
  };
  console.log(result);
  console.log(serial);

  expect(serial.bigint.byteLength).toBeGreaterThan(serial.number.byteLength);
  expect(result.bigint).toEqual(BigInt(result.number));
});

Deno.test('number is smaller than bigint for integers between 2^32 and 2^52', () => {
  const serial = {
    'number:2**33': serialize(2 ** 33),
    'number:2**52': serialize(2 ** 52),
    'bigint:2**33': serialize(2n ** 33n),
    'bigint:2**52': serialize(2n ** 52n),
  };
  const result = {
    'number:2**33': deserialize(serial['number:2**33']),
    'number:2**52': deserialize(serial['number:2**52']),
    'bigint:2**33': deserialize(serial['bigint:2**33']),
    'bigint:2**52': deserialize(serial['bigint:2**52']),
  };
  console.log(result);
  console.log(serial);

  expect(serial['bigint:2**33'].byteLength).toEqual(12);
  expect(serial['number:2**33'].byteLength).toEqual(11);
  expect(result['bigint:2**33']).toEqual(BigInt(result['number:2**33']));

  expect(serial['bigint:2**52'].byteLength).toEqual(12);
  expect(serial['number:2**52'].byteLength).toEqual(11);
  expect(result['bigint:2**52']).toEqual(BigInt(result['number:2**52']));
});

Deno.test('date object size is equal to timestamp number', () => {
  const date = new Date();
  const timestamp = date.getTime();
  const serialDate = serialize(date);
  const serialTimestamp = serialize(timestamp);
  const resultDate = deserialize(serialDate);
  const resultTimestamp = deserialize(serialTimestamp);
  console.log({
    serialDate,
    serialTimestamp,
    resultDate,
    resultTimestamp,
  });
  expect(date.getTime()).toEqual(resultDate.getTime());
  expect(serialDate.byteLength).toEqual(serialTimestamp.byteLength); // 11: 8 bytes for 64 bit value, 1 byte for type flag and perhaps 2 bytes for header
});

Deno.test('a row tuple is smaller than a row object', () => {
  const rowObject = {
    columnOne: 'str',
    columnTwo: true,
    columnThree: 5,
  };
  const serial = {
    rowObject: serialize(rowObject),
    rowTuple: serialize(Object.values(rowObject)),
  };
  const result = {
    rowObject: deserialize(serial.rowObject),
    rowTuple: deserialize(serial.rowTuple),
  };
  console.log('rowObjectByteLength:', serial.rowObject.byteLength); // 48
  console.log('rowTupleByteLength:', serial.rowTuple.byteLength); // 21
  console.log(result);
  expect(rowObject).toMatchObject(result.rowObject);
  expect(serial.rowObject.byteLength).toBeGreaterThan(
    serial.rowTuple.byteLength,
  );
});

Deno.test('a boolean is smaller than an integer', () => {
  const serial = {
    bool: serialize(true),
    int: serialize(1),
  };
  const result = {
    bool: deserialize(serial.bool),
    int: deserialize(serial.int),
  };
  console.log('boolByteLength:', serial.bool.byteLength); // 3
  console.log('intByteLength:', serial.int.byteLength); // 4
  expect(result.bool).toEqual(true);
  expect(serial.int.byteLength).toBeGreaterThan(
    serial.bool.byteLength,
  );
});
Deno.test('an array containing an integer is smaller than an array containing three booleans', () => {
  const serial = {
    bool: serialize([true, true, true]),
    int: serialize([7]), // equivalent integer flag for three true booleans
  };
  const result = {
    bool: deserialize(serial.bool),
    int: deserialize(serial.int),
  };
  console.log('boolArrayByteLength:', serial.bool.byteLength); // 10
  console.log('intArrayByteLength:', serial.int.byteLength); // 9
  expect(result.bool).toMatchObject([true, true, true]);
  expect(serial.bool.byteLength).toBeGreaterThan(
    serial.int.byteLength,
  );
});
Deno.test('an array containing an integer is same size as an array containing two booleans', () => {
  const serial = {
    bool: serialize([true, true]),
    int: serialize([3]), // equivalent integer flag for three true booleans
  };
  const result = {
    bool: deserialize(serial.bool),
    int: deserialize(serial.int),
  };
  console.log('boolArrayByteLength:', serial.bool.byteLength); // 9
  console.log('intArrayByteLength:', serial.int.byteLength); // 9
  expect(result.bool).toMatchObject([true, true]);
  expect(serial.bool.byteLength).toEqual(
    serial.int.byteLength,
  );
});
Deno.test('the precise size of a timestamp is 9 bytes', () => {
  const one = serialize([Date.now()]);
  const two = serialize([Date.now(), Date.now()]);
  const three = serialize([Date.now(), Date.now(), Date.now()]);
  const numBytes = two.byteLength - one.byteLength; // removes all miscellaneous data
  const numBytesTwo = three.byteLength - two.byteLength; // "proves" there is no byte padding magic
  console.log('Timestamp Bytes:', numBytes);
  expect(numBytes).toEqual(9); // 64 bits for the value, 8 bits perhaps for a type flag?
  expect(numBytesTwo).toEqual(9);
});
Deno.test('the precise size of a bool is 1 byte', () => {
  const one = serialize([true]);
  const two = serialize([true, true]);
  const three = serialize([true, true, true]);
  const numBytes = two.byteLength - one.byteLength;
  const numBytesTwo = three.byteLength - two.byteLength;
  console.log('bool bytes:', numBytes);
  expect(numBytes).toEqual(1); // h0ge
  expect(numBytesTwo).toEqual(1);
});
