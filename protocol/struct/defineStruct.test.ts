import { expect } from '@std/expect';
import z from '@zod/zod';
import { numZod } from './Numby.ts';
import { binaryRegistry } from './binarySchemaRegistry.ts';

Deno.test('can extract byte length from registry using meta', () => {
  const foo = z.object({
    bar: numZod.Ui8,
    notBinary: z.boolean(),
  });
  const binaryEntries: [string, z.ZodType][] = [];
  for (const [key, val] of Object.entries(foo._zod.def.shape)) {
    const entry = binaryRegistry.get(val);
    if (entry) binaryEntries.push([key, val]);
    console.log(entry);
  }
  expect(binaryEntries.length).toEqual(1);
});
