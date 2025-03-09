// deno-lint-ignore-file explicit-module-boundary-types explicit-function-return-type no-boolean-literal-for-arguments
import { serialize } from 'node:v8';

type Message = Record<string, unknown>;

const encoder = new TextEncoder();

const toMessage = (msg: Message) => encoder.encode(`${(serialize(msg)).toString('base64')}\n`);

export const startClient = async () => {
  const conn = await Deno.connect({
    hostname: '127.0.0.1',
    port: 8092,
    transport: 'tcp',
  });
  conn.setNoDelay(true);
  conn.setKeepAlive(true);
  const send = (msg: Message) => conn.write(toMessage(msg));

  return {
    async requestCommandSubscription() {
      await send({ kind: 'REQUEST_COMMAND_SUBSCRIPTION' });
    },
    async closeConnection() {
      await send({ kind: 'DISCONNECTING' });
      await conn.closeWrite();
      conn.close();
      conn.unref();
    },
  };
};
