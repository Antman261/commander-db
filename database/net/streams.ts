import { CircularBinaryBuffer } from '@db/utl';
import { deserialize } from 'node:v8';
import { ClientMessage } from './msg.ts';
import { toTransformStream } from '@std/streams';

const MSG_LEN_PORTION = 4;

export const JavaScriptBinaryDecodeStream = (): TransformStream<Uint8Array, ClientMessage> =>
  toTransformStream(async function* (src: ReadableStream<Uint8Array>): AsyncGenerator<ClientMessage> {
    let dataLength = 0;
    const blob = new CircularBinaryBuffer(2 ** 24);
    const isSizing = () => dataLength === 0;
    const hasDataLength = () => dataLength > 0 && blob.readable >= dataLength;
    const hasMsgLength = () => blob.readable >= MSG_LEN_PORTION;
    const setDataLength = () => dataLength = new Int32Array(blob.read(4))[0];
    for await (const chunk of src) {
      blob.write(chunk);
      if (isSizing() && hasMsgLength()) setDataLength();
      if (hasDataLength()) {
        try {
          yield deserialize(blob.read(dataLength)) as ClientMessage;
        } catch (error) {
          console.error(error);
        }
        dataLength = 0;
      }
    }
  });
