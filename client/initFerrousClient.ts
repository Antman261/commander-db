import { delay } from '@std/async';
import { BinaryDecodeStream } from '@fe-db/proto';
import type { Message } from './commonTypes.ts';
import { encodeBinaryMessage } from './encodeBinaryMessage.ts';
import { type ConnectionConfig, verifyConfig } from './config.ts';

type Command = Record<string, unknown>;
type Event = Record<string, unknown>;
type CommandHandler = (command: Command) => Promise<Event[] | Error | string>;
type CommandMessage = { k: 'COM'; cmd: Command } | { k: 'UNSUB_ACK' };

export const initFerrousClient = (opt?: ConnectionConfig) => {
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
        await delay(5);
        connection.close();
      },
      send,
    };
  };
  return {
    async subscribeToCommands(onCommand: CommandHandler, aggregates?: string[]) {
      const { connection, send, close } = await connect();
      const commandStream = connection.readable.pipeThrough(new BinaryDecodeStream<CommandMessage>());
      const commandProcessingLoop = (async () => {
        for await (const msg of commandStream) {
          if (msg.k === 'UNSUB_ACK') {
            await close();
            break;
          }
          if (msg.k === 'COM') {
            await send({ k: 'COM_RES', res: await onCommand(msg.cmd) });
          }
          // todo: add open telemetry
        }
      })();
      await send({ k: 'REQ_SUB', ags: aggregates });
      return {
        assignment: 'CommandSubscription',
        parameters: aggregates,
        unsubscribe: () => Promise.allSettled([send({ k: 'UNSUB' }), commandProcessingLoop]),
      };
    },
  };
};
