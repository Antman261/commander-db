import { delay } from '@std/async';
import { BinaryDecodeStream } from '../protocol/streams/BinaryDecodeStream.ts';
import type { Message } from './commonTypes.ts';
import { encodeBinaryMessage } from './encodeBinaryMessage.ts';
import { type ConnectionConfig, verifyConfig } from './config.ts';

type Command = Record<string, unknown>;
type Event = Record<string, unknown>;
type CommandHandler = (command: Command) => Promise<Event[] | Error | string>;
type CommandMessage = { k: 'COM'; cmd: Command } | { k: 'UNSUB_ACK' };
type Connection = {
  connection: Deno.TcpConn;
  close(): Promise<void>;
  send: (msg: Message) => Promise<number>;
};

export const initClient = (opt?: ConnectionConfig) => {
  const { hostname, port } = verifyConfig(opt);
  const connect = async () => {
    const connection = await Deno.connect({
      hostname,
      port,
    });
    connection.setNoDelay(true);
    connection.setKeepAlive(true);
    const send = (msg: Message) => connection.write(encodeBinaryMessage(msg)); // todo: only resolve promise once all bytes have been written
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
  let issueCommandConnection: Promise<Connection> | undefined;
  const connectLazily = () => (issueCommandConnection ??= connect());
  return {
    async startCommandSubscription(onCommand: CommandHandler, aggregates?: string[]) {
      const { connection, send, close } = await connect();
      const commandStream = connection.readable.pipeThrough(BinaryDecodeStream<CommandMessage>());
      const commandProcessingLoop = (async () => {
        for await (const msg of commandStream) {
          if (msg.k === 'UNSUB_ACK') {
            await close();
            break;
          }
          if (msg.k === 'COM') {
            await send({ k: 'COM_RES', res: await onCommand(msg.cmd) });
          }
        }
      })();
      await send({ k: 'REQ_SUB', ags: aggregates });
      return {
        assignment: 'CommandSubscription',
        parameters: aggregates,
        unsubscribe: () => Promise.allSettled([send({ k: 'UNSUB' }), commandProcessingLoop]),
      };
    },
    async startEventSubscription(fromEvent = 0) {
      const { connection, send, close } = await connect();
      const eventStream = connection.readable.pipeThrough(BinaryDecodeStream<Event>());
      await send({ k: 'SUB_E', s: fromEvent });
      return {
        eventStream,
        unsubscribe: () => send({ k: 'UNSUB' }).then(close),
      };
    },
    async issueCommand(cmd: Command) {
      const { send } = await connectLazily();
      await send(cmd);
    },
  };
};
