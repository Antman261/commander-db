import * as bytes from '@std/bytes';
import { toTransformStream } from '@std/streams';
import { serialize } from 'node:v8';
import { defaultOpt, HEADER_BYTES, type Opt } from './options.ts';

export const BinaryEncodeStream = <Message>(
  opt: Opt = defaultOpt(),
): TransformStream<Message, Uint8Array> =>
  toTransformStream(async function* (src) {
    const { maxBodyBytes } = { ...defaultOpt, ...opt } as Required<Opt>;
    for await (const msg of src) {
      const msgData = serialize(msg);
      if (msgData.byteLength > maxBodyBytes) {
        throw new RangeError(`Max message length exceeded (${maxBodyBytes} bytes)`);
      }
      const msgHeader = new Uint8Array(HEADER_BYTES);
      new Uint32Array(msgHeader.buffer)[0] = msgData.byteLength;
      yield bytes.concat([msgHeader, msgData]);
    }
  });
