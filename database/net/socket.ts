import { handleConnection } from "./conn.ts";

let listener: Deno.TcpListener;
export async function openSocketServer() {
  if (listener) {
    return;
  }
  listener = Deno.listen({
    hostname: "127.0.0.1",
    port: 8080,
    transport: "tcp",
  });
  for await (const conn of listener) {
    await handleConnection(conn);
  }
}
