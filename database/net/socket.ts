import { parseArgs } from '@std/cli';
import { LifecycleComponent } from '@antman/lifecycle';
import { RingBuffer } from '@db/utl';
import { handleConnection } from './conn.ts';

let listener: Deno.TcpListener;
const connections = new RingBuffer({ size: 50 }); // todo: determine number of connections based on available memory

function openSocketServer(): void {
  if (listener) return;
  const args = parseArgs(Deno.args);
  const port = args.port ?? 8092;

  listener = Deno.listen({ hostname: '127.0.0.1', port, transport: 'tcp' });
  (async () => {
    for await (const conn of listener) {
      connections.add(conn);
      conn.ref();
      handleConnection(conn).finally(() => connections.remove(conn));
    }
  })();
}

class ConnectionManager extends LifecycleComponent {
  start() {
    return Promise.resolve(openSocketServer());
  }
  async close() {
    await Promise.all(connections.values());
  }
}

export const connectionManager = new ConnectionManager();
