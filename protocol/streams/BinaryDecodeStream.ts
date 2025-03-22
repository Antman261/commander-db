import { toTransformStream } from '@std/streams';
import { deserialize } from 'node:v8';
import { CircularBinaryBuffer } from '@proto/util';
import { HEADER_BYTES, type Opt, verifyOptions } from './options.ts';

export const BinaryDecodeStream = <Message>(opt?: Opt): TransformStream<
  Uint8Array,
  Message
> =>
  toTransformStream(async function* (src) {
    const { maxBodyBytes } = verifyOptions(opt);
    try {
      let dataLength = 0;
      /**
       * The binary stream decoder allocates a fixed memory buffer memory for parsing messages.
       * Using this circular buffer to avoid memory allocation and deallocation significantly improves performance.
       */
      const binBuf = new CircularBinaryBuffer(maxBodyBytes);
      const isSizable = () => dataLength === 0 && binBuf.readable >= HEADER_BYTES;
      const hasDataLength = () => dataLength > 0 && binBuf.readable >= dataLength;
      const setDataLength = () => dataLength = new Uint32Array(binBuf.read(HEADER_BYTES))[0];
      const decodeMsg = () => deserialize(binBuf.read(dataLength)) as Message;
      for await (const chunk of src) {
        binBuf.write(chunk);
        while (isSizable() || hasDataLength()) {
          // this loop exhausts all complete messages in the memory buffer -- it's possible a single chunk contains many messages because a chunk is all bytes in the network buffer next time deno checks it. Between checks, n-many packets may have arrived, and any number of packets could contain any number of whole or partial messages.
          if (isSizable()) setDataLength();
          if (hasDataLength()) {
            yield decodeMsg();
            dataLength = 0;
          }
        }
      }
    } catch (error) {
      // todo: turn this into a connection error
      console.error(error);
    }
  });
