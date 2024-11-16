// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function () {
  return this.toString();
};
import { serialize, deserialize } from 'node:v8';
import { Buffer } from 'node:buffer';
import stringify from 'npm:fast-stringify';
import * as BSON from 'npm:bson';
import { Bench } from 'npm:tinybench';

const obj: Record<string, any> = {
  name: "I_AM_A_SASQUATCH",
  type: 'FOOBAR',
  payload: {
    bars: ['beep', 12, 'boop', 19600050036729n, true],
    at: new Date(),
  },
};
const objectWithoutCircle = { ...obj, payload: { ...obj.payload } };
obj.payload.obj = obj;

function serializeWithV8(v: any) {
 return serialize(v);
}

function deserializeWithV8(v: any) {
 return deserialize(v);
}

const byteSizeTable: Record<string, unknown>[] = [];

const resultV8 = serializeWithV8(obj);
const returnedV8 = deserializeWithV8(resultV8);
const resultV8ItWithoutCircle = serializeWithV8(objectWithoutCircle);
const returnedV8WithoutCircle = deserializeWithV8(resultV8ItWithoutCircle);
const resultVanillaStringify = JSON.stringify(objectWithoutCircle);
const returnedVanillaStringify = JSON.parse(resultVanillaStringify);
byteSizeTable.push({ 'Method': 'v8 serialize', 'Byte Length': resultV8.byteLength, 'Supports Circular References': true, 'Supports Dates': true, 'Supports Bigint': true})
byteSizeTable.push({ 'Method': 'v8 serialize without circle', 'Byte Length': resultV8ItWithoutCircle.byteLength, 'Supports Circular References': true, 'Supports Dates': true, 'Supports Bigint': true})
byteSizeTable.push({ 'Method': 'Vanilla Stringify', 'Byte Length': Buffer.from(resultVanillaStringify).byteLength, 'Supports Circular References': false, 'Supports Dates': false, 'Supports Bigint': false})
// const returnedV8WithJsonParse = JSON.parse(resultV8.toString('utf8')) // cannot parse
console.log(resultV8.byteLength);
console.log(resultV8ItWithoutCircle.byteLength);
console.log(Buffer.from(resultVanillaStringify).byteLength);

const serializedFastString = Buffer.from(stringify(obj));
const result = JSON.parse(serializedFastString.toString());
byteSizeTable.push({ 'Method': 'Buffer From Fast Stringpfy', 'Byte Length': serializedFastString.byteLength, 'Supports Circular References': false, 'Supports Dates': false, 'Supports Bigint': false})
// date becomes a string, bigint is converted to a string, circular reference lost
console.log(serializedFastString.byteLength)
console.log(result)

console.log(returnedV8);
console.log(returnedV8.payload.obj === returnedV8.payload.obj);

// const resBson = BSON.serialize(obj); // Cannot convert circular structure to BSON
// const bsonReturn = BSON.deserialize(resBson);
const resBson = BSON.serialize(objectWithoutCircle);
const bsonReturn = BSON.deserialize(resBson);
byteSizeTable.push({ 'Method': 'BSON', 'Byte Length': resBson.byteLength, 'Supports Circular References': false, 'Supports Dates': true, 'Supports Bigint': true})

console.log(resBson.byteLength);
console.log(bsonReturn);

const bench = new Bench({ name: 'simple benchmark', time: 100,
  setup: (_task, mode) => {
    // Run the garbage collector before warmup at each cycle
    if (mode === 'warmup' && typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
  }, });
bench
  .add('serialization: v8', () => {
    const resultV8 = serializeWithV8(obj);
  })
  .add('deserialization: v8', () => {
    const returnedV8 = deserializeWithV8(resultV8);
  })
  .add('serialization: fast-stringify + buffer', () => {
    const result = Buffer.from(stringify(obj));
  })
  .add('deserialization: buffer => string => JSON.parse', () => {
    const returned = JSON.parse(serializedFastString.toString());
  })
  .add('serialization: v8 without circular reference', () => {
    const resultV8 = serializeWithV8(obj);
  })
  .add('deserialization: v8 without circular reference', () => {
    const returnedV8 = deserializeWithV8(resultV8);
  })
  .add('deserialization: JSON.parse', () => JSON.parse(resultVanillaStringify))
  .add('serialization: BSON', () => BSON.serialize(objectWithoutCircle))
  .add('deserialization: BSON', () => BSON.deserialize(resBson));
(async () => {
  await bench.run();

  console.log(bench.name);
  console.table(bench.table());
  console.table(byteSizeTable);
  
})();

/**
 * NodeJs Results
 * ┌─────────┬─────────────────────────────────────────────────┬────────────────────────────┬───────────────────────────┬──────────────────────┬─────────────────────┬─────────┐ 
 * │ (index) │                     Task name                   │ Throughput average (ops/s) │ Throughput median (ops/s) │ Latency average (ns) │ Latency median (ns) │ Samples │ 
 * ├─────────┼─────────────────────────────────────────────────┼────────────────────────────┼───────────────────────────┼──────────────────────┼─────────────────────┼─────────┤ 
 * │    0    │                serialization: v8                │      724972 ± 0.23%        │           666662          │   2001.52 ± 37.37%   │      1500.01      │  49963  │ 
 * │    1    │               deserialization: v8               │      722250 ± 0.06%        │           727262          │   1704.40 ± 13.47%   │      1375.02      │  58672  │ 
 * │    2    │     serialization: fast-stringify + buffer      │      411884 ± 0.06%        │           413905          │   2536.44 ± 2.94%    │      2416.01      │  39426  │ 
 * │    3    │ deserialization: buffer => string => JSON.parse │     1211923 ± 0.03%        │          1200516          │    842.32 ± 0.92%    │       832.97       │ 118720  │ 
 * │    4    │  serialization: v8 without circular reference   │      718617 ± 0.20%        │           705726          │   1536.05 ± 0.55%    │      1416.98      │  65103  │ 
 * │    5    │ deserialization: v8 without circular reference  │      741496 ± 0.05%        │           750189          │   1460.66 ± 7.39%    │      1333.00      │  68463  │ 
 * │    6    │           deserialization: JSON.parse           │     1523889 ± 0.02%        │          1501451          │    664.55 ± 0.28%    │       666.02       │ 150479  │ 
 * │    7    │               serialization: BSON               │     1041698 ± 0.04%        │          1043814          │   1002.72 ± 2.22%    │       958.03       │  99729  │ 
 * │    8    │              deserialization: BSON              │      688292 ± 0.04%        │           685876          │   1521.56 ± 2.12%    │      1457.99      │  65723  │ 
 * └─────────┴─────────────────────────────────────────────────┴───────────────────────── ─┴─────────────────────────┴────────────────────┴───────────────────┴─────────┘
 * ┌─────────┬───────────────────────────────┬─────────────┬──────────────────────────────┬────────────────┬─────────────────┐ 
 * │ (index) │            Method             │ Byte Length │ Supports Circular References │ Supports Dates │ Supports Bigint │ 
 * ├─────────┼───────────────────────────────┼─────────────┼──────────────────────────────┼────────────────┼─────────────────┤ 
 * │    0    │        v8 serialize         │     111     │             true             │      true      │      true       │ 
 * │    1    │ v8 serialize without circle │     104     │             true             │      true      │      true       │ 
 * │    2    │      Vanilla Stringify      │     135     │            false             │     false      │      false      │ 
 * │    3    │ Buffer From Fast Stringpfy  │     151     │            false             │     false      │      false      │ 
 * │    4    │            BSON             │     132     │            false             │      true      │      true       │ 
 * └─────────┴───────────────────────────────┴─────────────┴──────────────────────────────┴────────────────┴─────────────────┘
 * 
 * Deno Results
 * ┌───────┬───────────────────────────────────────────────────┬────────────────────────────┬───────────────────────────┬──────────────────────┬─────────────────────┬─────────┐
 * │ (idx) │ Task name                                         │ Throughput average (ops/s) │ Throughput median (ops/s) │ Latency average (ns) │ Latency median (ns) │ Samples │
 * ├───────┼───────────────────────────────────────────────────┼────────────────────────────┼───────────────────────────┼──────────────────────┼─────────────────────┼─────────┤
 * │     0 │ "serialization: v8"                               │ "629316 ± 0.38%"           │ "545256"                  │ "3527.04 ± 57.05%"   │ "1834.00"           │ 35197   │
 * │     1 │ "deserialization: v8"                             │ "763865 ± 0.11%"           │ "774593"                  │ "2800.50 ± 58.55%"   │ "1291.00"           │ 35708   │
 * │     2 │ "serialization: fast-stringify + buffer"          │ "402784 ± 0.11%"           │ "406835"                  │ "4435.95 ± 48.20%"   │ "2458.00"           │ 22684   │
 * │     3 │ "deserialization: buffer => string => JSON.parse" │ "1369760 ± 0.04%"          │ "1410437"                 │ "1317.14 ± 48.87%"   │ "709.00"            │ 75922   │
 * │     4 │ "serialization: v8 without circular reference"    │ "600359 ± 0.41%"           │ "521648"                  │ "4582.53 ± 65.16%"   │ "1917.00"           │ 29365   │
 * │     5 │ "deserialization: v8 without circular reference"  │ "739218 ± 0.13%"           │ "750188"                  │ "3222.59 ± 62.85%"   │ "1333.00"           │ 33973   │
 * │     6 │ "deserialization: JSON.parse"                     │ "2151867 ± 0.03%"          │ "2183406"                 │ "476.86 ± 0.42%"     │ "458.00"            │ 209705  │
 * │     7 │ "serialization: BSON"                             │ "207944 ± 0.46%"           │ "218150"                  │ "12954.09 ± 55.87%"  │ "4584.00"           │ 8917    │
 * │     8 │ "deserialization: BSON"                           │ "1199812 ± 0.08%"          │ "1200480"                 │ "3483.75 ± 66.21%"   │ "833.00"            │ 30991   │
 * └───────┴───────────────────────────────────────────────────┴────────────────────────────┴───────────────────────────┴──────────────────────┴─────────────────────┴─────────┘
 * Conclusion:
 * BSON is slightly faster but has significant limitations: 
 * * it cannot parse circular references
 * * it replaces undefined with null
 * * it is also significantly larger: 132 bytes vs 104 bytes
 * * it is significantly slower in deno
 * v8 serialization and deserialization is the simplest to work with, most space efficient, and fast enough.
 */
