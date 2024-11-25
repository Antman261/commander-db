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
