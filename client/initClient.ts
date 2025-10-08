import { delay } from '@std/async';
import {
  BinaryDecodeStream,
  bye,
  type ClientMessage,
  commandCompleted,
  type CommandInputMessage,
  type CommandMessage,
  type DbMessage,
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

type CommandHandler = (command: CommandMessage) => Promise<PotentialEvent[] | Error | string>;

type Connection = {
  connection: Deno.TcpConn;
  close(): Promise<void>;
  send: (msg: ClientMessage) => Promise<void>;
};

type Client = {
  startCommandSubscription(
    onCommand: CommandHandler,
    maxConcurrency?: number,
    aggregates?: string[],
  ): Promise<{ assignment: string; parameters: string[] | undefined; unsubscribe: () => Promise<void> }>;
  startEventSubscription(
    fromEvent?: bigint,
  ): Promise<
    {
      eventStream: ReadableStream<import('@fe-db/proto').DecodedMessageTuple<Event>>;
      unsubscribe: () => Promise<void>;
    }
  >;
  issueCommand: (cmd: CommandInputMessage) => Promise<bigint>;
};

export const initClient = async (
  opt?: ConnectionConfig,
): Promise<Client> => {
  const { hostname, port } = verifyConfig(opt);
  const connect = async () => {
    // TODO: Replace TCP socket with WebTransport: https://developer.chrome.com/docs/capabilities/web-apis/webtransport
    const connection = await Deno.connect({
      hostname,
      port,
    });
    connection.setNoDelay(true);
    connection.setKeepAlive(true);
    const send = async (msg: ClientMessage) => {
      await connection.write(encodeBinaryMessage(msg)); // todo: only resolve promise once all bytes have been written
    };
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
  const initIssueCommandConnection = async () => {
    const promiseBuffer: PromiseWithResolvers<CommandMessage['id']>[] = [];
    const { send, connection } = await connect();
    const messageStream = connection.readable.pipeThrough(BinaryDecodeStream<DbMessage>());
    (async () => {
      for await (const [msg] of messageStream) {
        switch (msg.k) {
          case dbMsg.commandIssued: {
            promiseBuffer.shift()?.resolve(msg.cmdId);
          }
        }
      }
    })();
    return async (cmd: CommandInputMessage) => {
      await send(issueCommand(cmd));
      const pwr = Promise.withResolvers<CommandMessage['id']>();
      promiseBuffer.push(pwr);
      return pwr.promise;
    };
  };
  return {
    async startCommandSubscription(onCommand: CommandHandler, maxConcurrency = 20, aggregates?: string[]) {
      const { connection, send, close } = await connect();
      const commandStream = connection.readable.pipeThrough(BinaryDecodeStream<DbMessage>());
      const commandProcessingLoop = (async () => {
        for await (const [msg] of commandStream) {
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
      await send(requestCommandSubscription(maxConcurrency, aggregates));
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
    issueCommand: await initIssueCommandConnection(),
  };
};
