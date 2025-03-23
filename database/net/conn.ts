import { ClientMessage, handleMessage } from './msg.ts';
import { BinaryDecodeStream, BinaryEncodeStream } from '@fe-db/proto';
import { toTransformStream } from '@std/streams';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  console.log('Handling connection');
  await conn.readable
    .pipeThrough(BinaryDecodeStream<ClientMessage>())
    .pipeThrough(MessageResponseStream())
    .pipeThrough(BinaryEncodeStream())
    .pipeTo(conn.writable);
}

export const MessageResponseStream = <Request, Response>(): TransformStream<ClientMessage, ClientMessage> =>
  toTransformStream(async function* (src) {
    for await (const msg of src) yield await handleMessage(msg);
  });
