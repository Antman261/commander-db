import { serialize } from 'node:v8';
import { writeFile} from 'node:fs/promises';

const obj: Record<string, any> = {
  name: "I_AM_A_SASQUATCH",
  type: 'FOOBAR',
  payload: {
    bars: ['beep', 12, 'boop', 19600050036729n, true],
    at: new Date('2024-11-03T01:23:59.612Z'),
  },
};

obj.payload.obj = obj;
console.log(obj)

const bytes = serialize(obj);
console.log(bytes.toString());
// @ts-ignore: Deno seems pretty confused about buffers
console.log(bytes.byteLength);

// @ts-ignore: Deno seems pretty confused about buffers
await writeFile("node_serialized.bdat", bytes); 