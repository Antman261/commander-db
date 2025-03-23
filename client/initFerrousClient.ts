import { BinaryDecodeStream } from '@fe-db/proto';
import type { Message } from './commonTypes.ts';
import { encodeBinaryMessage } from './encodeBinaryMessage.ts';
import { type ConnectionConfig, verifyConfig } from './config.ts';

type Func = (...args: never[]) => unknown;
type Command = Record<string, unknown>;
type Event = Record<string, unknown>;
type CommandHandler = (command: Command) => Promise<Event[]>;
type CommandMessage = { k: 'COM'; command: Command } | { k: 'UNSUB_ACK' };

export const initFerrousClient = (opt: ConnectionConfig) => {
  const { hostname, port } = verifyConfig(opt);
  const connect = async () => {
    const connection = await Deno.connect({
      hostname,
      port,
    });
    connection.setNoDelay(true);
    connection.setKeepAlive(true);
    const send = (msg: Message) => connection.write(encodeBinaryMessage(msg));
    return {
      connection,
      async close() {
        await send({ k: 'EXIT' });
        await connection.closeWrite();
        connection.close();
        connection.unref();
      },
      send,
    };
  };
  return {
    async subscribeToCommands(onCommand: CommandHandler, aggregates?: string[]) {
      const { connection, send, close } = await connect();
      const commandStream = connection.readable.pipeThrough(BinaryDecodeStream<CommandMessage>());
      (async () => {
        for await (const msg of commandStream) {
          if (msg.k === 'UNSUB_ACK') {
            await close();
            break;
          }
          // todo: add open telemetry
          await send({ k: 'COM_RES', evs: await onCommand(msg.command) });
        }
      })();
      await send({ k: 'REQ_SUB', ags: aggregates });
      return {
        assignment: 'CommandSubscription',
        parameters: aggregates,
        unsubscribe: () => send({ k: 'UNSUB' }),
      };
    },
  };
};
