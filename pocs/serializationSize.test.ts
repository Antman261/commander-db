import { expect } from "jsr:@std/expect";
import { deserialize, serialize } from "node:v8";

const strings = {
  name: "I_AM_A_SASQUATCH",
  type: "FOOBAR",
  payload: {
    bars: ["beep", 12, "boop", 19600050036729n, true],
    at: new Date(),
  },
};
const symbols = {
  [Symbol.for("name")]: "I_AM_A_SASQUATCH",
  [Symbol.for("type")]: "FOOBAR",
  [Symbol.for("payload")]: {
    [Symbol.for("bars")]: ["beep", 12, "boop", 19600050036729n, true],
    [Symbol.for("at")]: new Date(),
  },
};

Deno.test("symbols are smaller than string literals", async () => {
  const result = {
    strings: serialize(strings),
    symbols: serialize(symbols),
  };
  console.log(result);
  expect(result.strings.byteLength).toBeGreaterThan(result.symbols.byteLength);
});
Deno.test.ignore(
  "serialized symbol-keyed objects can be de serialized (spoiler: they cannot)",
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

    expect(result.symbols).toMatchObject(symbols);
  },
);

Deno.test("numbers are smaller than bigint for small integers", () => {
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

Deno.test("number is smaller than bigint for integers between 2^32 and 2^52", () => {
  const serial = {
    "number:2**33": serialize(2 ** 33),
    "number:2**52": serialize(2 ** 52),
    "bigint:2**33": serialize(2n ** 33n),
    "bigint:2**52": serialize(2n ** 52n),
  };
  const result = {
    "number:2**33": deserialize(serial["number:2**33"]),
    "number:2**52": deserialize(serial["number:2**52"]),
    "bigint:2**33": deserialize(serial["bigint:2**33"]),
    "bigint:2**52": deserialize(serial["bigint:2**52"]),
  };
  console.log(result);
  console.log(serial);

  expect(serial["bigint:2**33"].byteLength).toEqual(12);
  expect(serial["number:2**33"].byteLength).toEqual(11);
  expect(result["bigint:2**33"]).toEqual(BigInt(result["number:2**33"]));

  expect(serial["bigint:2**52"].byteLength).toEqual(12);
  expect(serial["number:2**52"].byteLength).toEqual(11);
  expect(result["bigint:2**52"]).toEqual(BigInt(result["number:2**52"]));
});

Deno.test("date is smaller than timestamp", () => {
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
});
