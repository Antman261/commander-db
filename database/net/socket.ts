import { Component } from '@db/lifecycle';
import { handleConnection } from './conn.ts';

let listener: Deno.TcpListener;
const connections: Promise<void>[] = [];
let status: 'RUNNING' | 'CLOSING' | 'CLOSED' = 'RUNNING';
let mainLoopPromise: Promise<void>;

function openSocketServer(): void {
  if (listener) return;
  console.log('ConnectionManager: Starting...');
  listener = Deno.listen({
    hostname: '127.0.0.1',
    port: 8092,
    transport: 'tcp',
  });
  mainLoopPromise = (async () => {
    while (status === 'RUNNING') {
      const conn = await listener.accept();
      connections.push(handleConnection(conn));
    }
  })();
}

export const connectionManager: Component = {
  async start() {
    await openSocketServer();
  },
  async close() {
    status = 'CLOSING';

    await Promise.all(connections.concat(mainLoopPromise));
    status = 'CLOSED';
  },
  getStatus() {
    return Promise.resolve(status);
  },
};
