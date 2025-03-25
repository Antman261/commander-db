import { Component } from '@db/lifecycle';
import { RingBuffer } from '@db/utl';
import { handleConnection } from './conn.ts';

let listener: Deno.TcpListener;
const connections = new RingBuffer({ size: 500 }); // todo: determine number of connections based on available memory
let status: 'pending' | 'running' | 'crashed' = 'pending';

function openSocketServer(): void {
  if (listener) return;
  listener = Deno.listen({
    hostname: '127.0.0.1',
    port: 8092,
    transport: 'tcp',
  });
  status = 'running';
  (async () => {
    for await (const conn of listener) {
      connections.add(conn);
      conn.ref();
      handleConnection(conn).finally(() => connections.remove(conn));
    }
  })();
}

export const connectionManager: Component = {
  name: 'connectionManager',
  start() {
    openSocketServer();
    return Promise.resolve();
  },
  async close() {
    await Promise.all(connections.values());
  },
  getStatus() {
    return Promise.resolve(status);
  },
};
