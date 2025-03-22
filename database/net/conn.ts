import { ClientMessage, handleMessage } from './msg.ts';
import { BinaryDecodeStream } from '@fe-db/proto';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  console.log('Handling connection');
  const messageStream = conn.readable
    .pipeThrough(BinaryDecodeStream<ClientMessage>());
  for await (const message of messageStream) {
    console.log('Handling message');
    await handleMessage(message);
  }
}
