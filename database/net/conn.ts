import { ClientMessage } from './msg.ts';
import { BinaryDecodeStream, BinaryEncodeStream } from '@fe-db/proto';
import { delay } from '@std/async';

export async function handleConnection(conn: Deno.TcpConn): Promise<void> {
  try {
    const id = crypto.randomUUID();
    console.log('Handling connection', id);
    // await authenticateClientConnection(conn)
    await conn.readable
      .pipeThrough(BinaryDecodeStream<ClientMessage>({ maxBodyBytes: 2097140 }))
      .pipeThrough(new MessageResponseStream(id))
      .pipeThrough(BinaryEncodeStream())
      .pipeTo(conn.writable);
    console.log('Closed connection:', id);
  } catch (error) {
    console.log('connection error:', error);
  }
}

type CommandSubscriber = { id: string; dispatchCommand(cmd: ClientMessage): void };
const commandSubscribers: Record<string, CommandSubscriber> = {};
const registerCommandSubscriber = (reg: CommandSubscriber) => {
  commandSubscribers[reg.id] = reg;
};
const deregisterCommandSubscriber = (id: CommandSubscriber['id']) => {
  delete commandSubscribers[id];
};
class MessageResponseStream extends TransformStream<ClientMessage, ClientMessage> {
  constructor(id: string) {
    super({
      start() {},
      async transform(msg, controller) {
        try {
          switch (msg.k) {
            case 'REQ_SUB':
              controller.enqueue({ k: 'ACK_SUB' });
              registerCommandSubscriber({
                id,
                dispatchCommand: controller.enqueue,
              });
              await delay(0);
              controller.enqueue({ k: 'COM', cmd: { name: 'hello!' } });
              break;
            case 'UNSUB':
              deregisterCommandSubscriber(id);
              controller.enqueue({ k: 'UNSUB_ACK' });
              break;
            case 'EXIT':
              controller.terminate();
              break;
            default:
              controller.enqueue({ k: 'ACK' });
              break;
          }
        } catch (err) {
          console.log('err:', err);
        }
      },
    });
  }
}
