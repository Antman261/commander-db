import { deserialize } from 'node:v8';
import { decodeBase64 } from '@std/encoding';
import { ClientMessage } from './msg.ts';

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
