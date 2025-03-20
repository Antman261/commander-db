import * as bytes from '@std/bytes';
import { deserialize } from 'node:v8';
import { decodeBase64, decodeVarint32 } from '@std/encoding';
import { ClientMessage } from './msg.ts';
import { toTransformStream } from '@std/streams';

const MSG_LEN_PORTION = 4;

export const JavaScriptBinaryDecodeStream = (): TransformStream<Uint8Array, ClientMessage> =>
  toTransformStream(async function* (src: ReadableStream<Uint8Array>): AsyncGenerator<ClientMessage> {
    let dataLength = 0;
    let blob = new Uint8Array();
    for await (const chunk of src) {
      blob = bytes.concat([blob, chunk]);
      console.log('blob:', blob);
      const isSizing = dataLength === 0;
      if (isSizing) {
        const hasMsgLength = blob.byteLength >= MSG_LEN_PORTION;
        if (hasMsgLength) {
          console.log('hasMsgLength');
          const [num] = decodeVarint32(chunk.subarray(0, MSG_LEN_PORTION));
          dataLength = num + MSG_LEN_PORTION;
          console.log('dataLength:', dataLength);
        }
      }
      const hasDataLength = isSizing === false && blob.byteLength >= dataLength;
      if (hasDataLength) {
        console.log('hasDataLength', hasDataLength);
        const data = blob.subarray(MSG_LEN_PORTION, dataLength);
        console.log('data:', data);
        const obj = deserialize(data) as ClientMessage;
        console.log('obj:', obj);
        yield obj;
        blob = blob.slice(dataLength);
        dataLength = 0;
      }
    }
  });

export const Base64DecoderStream = (): TransformStream<string, Uint8Array> =>
  new TransformStream({
    transform(chunk, controller): void {
      console.log('Base64DecoderStream:', chunk);
      controller.enqueue(decodeBase64(chunk));
    },
  });

export const DeserializationStream = (): TransformStream<Uint8Array, ClientMessage> =>
  new TransformStream({
    transform(chunk, controller): void {
      console.log('DeserializationStream:', chunk);
      controller.enqueue(deserialize(chunk));
    },
  });
