import { BinaryDecodeStream, BinaryEncodeStream, ClientMessage } from '@fe-db/proto';
import { MessageResponseStream } from './MessageResponseStream.ts';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  try {
    const id = crypto.randomUUID();
    // await authenticateClientConnection(conn)
    await conn.readable
      .pipeThrough(BinaryDecodeStream<ClientMessage>({ maxBodyBytes: 128 * 1024 }))
      .pipeThrough(new MessageResponseStream(id))
      .pipeThrough(BinaryEncodeStream())
      .pipeTo(conn.writable);
  } catch (error) {
    console.log('connection error:', error);
  }
}
