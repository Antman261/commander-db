import { delay } from '@std/async';
import { handleConnection } from './conn.ts';

let listener: Deno.TcpListener;

export async function openSocketServer(): Promise<void> {
  if (listener) return;
  listener = Deno.listen({
    hostname: '127.0.0.1',
    port: 8092,
    transport: 'tcp',
  });
  // (async () => {
  for await (const conn of listener) await handleConnection(conn);
  // })();
  await delay(10);
}
