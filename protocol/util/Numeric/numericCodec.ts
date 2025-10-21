// import { z } from '@zod/zod';
// import { UInt8, UInt16, UInt32, SInt16, SInt32, SInt8 } from './Numerics.ts';
// const defineEncodedNumeric = (kind: string) =>
//   z.object({
//     _t: kind,
//     _v: z.instanceof(Uint8Array),
//   });
// const encodedUInt8 = defineEncodedNumeric('ui8');
// const encodedUInt16 = defineEncodedNumeric('ui16');
// const encodedUInt32 = defineEncodedNumeric('ui32');
// const encodedInt8 = defineEncodedNumeric('i8');
// const encodedInt16 = defineEncodedNumeric('i16');
// const encodedInt32 = defineEncodedNumeric('i32');

// const decodedUInt8  = z.instanceof(UInt8);
// const decodedUInt16  = z.instanceof(UInt16);
// const decodedUInt32  = z.instanceof(UInt32);
// const decodedInt8  = z.instanceof(SInt8);
// const decodedInt16  = z.instanceof(SInt16);
// const decodedInt32 = z.instanceof(SInt32);

// const UInt8codec = z.codec(encodedUInt8, decodedUInt8, {
//   encode: (ui) => ({_t: 'ui8', _v})
// })
// export const numericCodec = z.codec(encodedSchema);
// // const encodedSchema = z.discriminatedUnion('_t', [
// //   encodedUInt8,
// //   encodedUInt16,
// //   encodedUInt32,
// //   encodedInt8,
// //   encodedInt16,
// //   encodedInt32,
// // ]);
