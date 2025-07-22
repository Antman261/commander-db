import { delay } from '@std/async';
import {
  BinaryDecodeStream,
  bye,
  type ClientMessage,
  commandCompleted,
  type CommandInputMessage,
  type CommandMessage,
  type DbCmdSubMsgs,
  dbMsg,
  endCommandSubscription,
  endEventSubscription,
  issueCommand,
  type PotentialEvent,
  requestCommandSubscription,
  requestEventSubscription,
} from '@fe-db/proto';
import { encodeBinaryMessage } from './encodeBinaryMessage.ts';
import { type ConnectionConfig, verifyConfig } from './config.ts';

type CommandHandler = (command: CommandInputMessage) => Promise<PotentialEvent[] | Error | string>;

type Connection = {
  connection: Deno.TcpConn;
  close(): Promise<void>;
  send: (msg: ClientMessage) => Promise<number>;
};

export const initClient = (opt?: ConnectionConfig) => {
  const { hostname, port } = verifyConfig(opt);
  const connect = async () => {
    // TODO: Replace TCP socket with WebTransport: https://developer.chrome.com/docs/capabilities/web-apis/webtransport
    const connection = await Deno.connect({
      hostname,
      port,
    });
    connection.setNoDelay(true);
    connection.setKeepAlive(true);
    const send = (msg: ClientMessage) => connection.write(encodeBinaryMessage(msg)); // todo: only resolve promise once all bytes have been written
    return {
      connection,
      async close() {
        await send(bye());
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
      const commandStream = connection.readable.pipeThrough(BinaryDecodeStream<DbCmdSubMsgs>());
      const commandProcessingLoop = (async () => {
        for await (const msg of commandStream) {
          switch (msg.k) {
            case dbMsg.commandSubscriptionEnded:
              return await close();
            case dbMsg.commandAssigned:
              await send(commandCompleted(await onCommand(msg.cmd)));
              break;
          }
        }
      })();
      const unsubscribe = async () => {
        await Promise.allSettled([send(endCommandSubscription()), commandProcessingLoop]);
      };
      await send(requestCommandSubscription(aggregates));
      return {
        assignment: 'CommandSubscription',
        parameters: aggregates,
        unsubscribe,
      };
    },
    async startEventSubscription(fromEvent = 0n) {
      const { connection, send, close } = await connect();
      const eventStream = connection.readable.pipeThrough(BinaryDecodeStream<Event>());
      await send(requestEventSubscription(fromEvent));
      return {
        eventStream,
        unsubscribe: () => send(endEventSubscription()).then(close),
      };
    },
    async issueCommand(cmd: CommandMessage) {
      const { send } = await connectLazily();
      await send(issueCommand(cmd));
    },
  };
};
