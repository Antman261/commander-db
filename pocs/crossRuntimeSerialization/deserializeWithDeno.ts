import { deserialize } from 'node:v8';

const bytesDeno = await Deno.readFile(
  './pocs/crossRuntimeSerialization/deno_serialized.bdat',
);
const objD = deserialize(bytesDeno);
const objD2 = deserialize(bytesDeno);
const bytesN = await Deno.readFile(
  './pocs/crossRuntimeSerialization/node_serialized.bdat',
);
const objN = deserialize(bytesN);

console.log(objD);
console.log(objN);
console.log(objD === objN);
console.log(objD === objD2);
