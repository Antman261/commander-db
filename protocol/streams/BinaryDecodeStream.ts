import { deserialize } from 'node:v8';
import { BinaryRingBuffer } from '@proto/util';
import { HEADER_BYTES, type Opt, verifyOptions } from './options.ts';

export class BinaryDecodeStream<Message> extends TransformStream<Uint8Array, Message> {
  constructor(opt?: Opt) {
    const { maxBodyBytes } = verifyOptions(opt);
    let dataLength = 0;
    /**
     * Using the binary stream decoder allocates a fixed memory buffer for parsing messages which improves performance by avoidpng memory allocation and deallocation.
     */
    const binBuf = new BinaryRingBuffer(maxBodyBytes);
    const isSizable = () => dataLength === 0 && binBuf.readable >= HEADER_BYTES;
    const hasDataLength = () => dataLength > 0 && binBuf.readable >= dataLength;
    const setDataLength = () => dataLength = new Uint32Array(binBuf.read(HEADER_BYTES))[0];
    const decodeMsg = () => deserialize(binBuf.read(dataLength)) as Message;
    super({
      start() {},
      transform(chunk, controller) {
        binBuf.write(chunk);
        while (isSizable() || hasDataLength()) {
          // this loop exhausts all complete messages in the memory buffer -- it's possible a single chunk contains many messages because a chunk is all bytes in the network buffer next time deno checks it. Between checks, n-many packets may have arrived, and any number of packets could contain any number of whole or partial messages.
          if (isSizable()) setDataLength();
          if (hasDataLength()) {
            controller.enqueue(decodeMsg());
            dataLength = 0;
          }
        }
      },
    });
  }
}
