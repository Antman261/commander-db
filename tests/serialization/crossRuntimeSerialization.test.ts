import { expect } from "jsr:@std/expect";
import { deserialize, serialize } from "node:v8";

Deno.test("can deserialize byte array representations created from node or deno", async () => {
  const bytesDeno = await Deno.readFile(
    "./tests/serialization/deno_serialized.bdat",
  );
  const bytesN = await Deno.readFile(
    "./tests/serialization/node_serialized.bdat",
  );
  const objD = deserialize(bytesDeno);
  const objN = deserialize(bytesN);
  expect(objD).toMatchObject(objN);
});

Deno..test("can deserialize Set", () => {
  const result = deserialize(serialize(new Set([1, 2, 3])));
  console.log(result);
  console.log(typeof result);
  expect({ o: result }).toMatchObject({ o: [1, 2, 3] });
});
