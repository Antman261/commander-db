import { TextLineStream } from '@std/streams';
import { handleMessage } from './msg.ts';
import { Base64DecoderStream, DeserializationStream } from './streams.ts';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  const messageStream = conn.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(Base64DecoderStream())
    .pipeThrough(DeserializationStream());
  for await (const message of messageStream) await handleMessage(message);
}
