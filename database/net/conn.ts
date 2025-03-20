import { handleMessage } from './msg.ts';
import { JavaScriptBinaryDecodeStream } from './streams.ts';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  console.log('Handling connection');
  const messageStream = conn.readable
    .pipeThrough(JavaScriptBinaryDecodeStream());
  for await (const message of messageStream) {
    console.log('Handling message');
    await handleMessage(message);
  }
}
