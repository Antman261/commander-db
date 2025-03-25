import { deserialize } from 'node:v8';
import { BinaryRingBuffer } from '@proto/util';
import { HEADER_BYTES, type Opt, verifyOptions } from './options.ts';
import { toTransformStream } from '@std/streams';

export const BinaryDecodeStream = <Message>(
  opt?: Opt,
): TransformStream<Uint8Array, Message> =>
  toTransformStream(async function* (src) {
    // I could lower the default memory allocation by adding overflow support -- if the data length is greater than the pre allocated buffer, we could take the hit and allocate more memory. This might be more efficient overall because it will allow greater number of concurrent connections
    const { maxBodyBytes } = verifyOptions(opt);
    let msgLength = 0;
    /**
     * Using the binary stream decoder allocates a fixed memory buffer for parsing messages which improves performance by avoiding memory allocation and deallocation.
     */
    const binBuf = new BinaryRingBuffer(maxBodyBytes);
    const isSizable = () => +msgLength === 0 && binBuf.readable >= HEADER_BYTES;
    const hasMsgLength = () => +msgLength > 0 && binBuf.readable >= +msgLength;
    const setMsgLength = () => msgLength = new Uint32Array(binBuf.read(HEADER_BYTES))[0];
    const decodeMsg = () => deserialize(binBuf.read(+msgLength)) as Message;
    for await (const chunk of src) {
      try {
        binBuf.write(chunk);
        while (isSizable() || hasMsgLength()) {
          /**
           * this loop exhausts all complete messages in the memory buffer -- it's possible a single
           * chunk contains many messages because a chunk is all bytes in the network buffer next time deno
           * checks it. Between checks, n-many packets may have arrived, and any number of packets could
           * contain any number of whole or partial messages.
           */
          if (isSizable()) setMsgLength();
          if (hasMsgLength()) {
            const msg = decodeMsg();
            console.log('yielding', msg);
            yield msg;
            msgLength = 0;
          }
        }
      } catch (err) {
        console.log('err:', err); // todo: handle properly -- send error to client
      }
    }
  });
