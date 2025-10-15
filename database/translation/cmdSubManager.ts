import { delay } from '@std/async';
import { is, isUndefined } from '@antman/formic-utils';
import { LifecycleNode } from '@antman/lifecycle';
import { CommandMessage, DbMessage } from '@fe-db/proto';
import { getActiveStreams } from '@db/state';
import { cmdStatus } from '@db/type';
import { CommandSubscriber } from './CommandSubscriber.ts';

export type Candidate = {
  id: string;
  sendMsg<M extends DbMessage>(cmd: M): void;
  maxConcurrentCmds: number;
  commitHash?: string;
};

type CommandSubscriberManager = LifecycleNode & {
  registerCommandSubscriber(c: Candidate): void;
  deregisterCommandSubscriber(id: Candidate['id']): Promise<void>;
  onCommandResult(id: Candidate['id']): void;
};
const newCmdSubscriberManager = (): CommandSubscriberManager => {
  const subscribers: Record<string, CommandSubscriber> = {};
  const subscriberCircle: CommandSubscriber[] = [];
  let nextIdx = 0;
  const incrementCircleIndex = () => (nextIdx + 1) % subscriberCircle.length;
  const limitCircleIndex = () => {
    const length = subscriberCircle.length;
    if (length === 0) return;
    if (is(nextIdx).not.lessThan(length)) nextIdx = length - 1;
  };
  const dispatchCommand = async (cmd: CommandMessage): Promise<void> => {
    let subscriber: CommandSubscriber | undefined;
    let attempts = 0;
    const attemptLimit = subscriberCircle.length;
    do {
      subscriber = subscriberCircle.at(nextIdx);
      incrementCircleIndex();
      attempts++;
      if (attempts > attemptLimit) await delay(attempts);
    } while (isUndefined(subscriber) || subscriber.status !== 'free');
    subscriber.dispatchCommand(cmd);
  };
  let isRunning = false;
  let mainLoopPromise: Promise<void> | undefined;
  return ({
    name: 'CommandSubscriptionManager',
    start() {
      // todo
      isRunning = true;
      mainLoopPromise = (async () => {
        while (isRunning) {
          for (const stream of getActiveStreams()) {
            if (stream.headCommand?.status !== cmdStatus.pending) return;
            // todo: Write journal entry for command started
            await dispatchCommand(stream.headCommand);
          }
        }
      })();
      return Promise.resolve();
    },
    async close() {
      // todo
      isRunning = false;
      await mainLoopPromise;
    },
    registerCommandSubscriber: (c: Candidate): void => {
      // todo: add validation, e.g. not already subscribed
      subscriberCircle.push(subscribers[c.id] = new CommandSubscriber(c));
    },
    deregisterCommandSubscriber: async (id: Candidate['id']): Promise<void> => {
      // todo: add validation, e.g. subscription exists, isn't currently processing command
      const subscriber = subscribers[id];
      subscriberCircle.splice(subscriberCircle.indexOf(subscriber), 1);
      await subscriber.deregister();
      delete subscribers[id];
      limitCircleIndex();
    },
    onCommandResult: (id: Candidate['id']): void => subscribers[id].onCommandResult(),
  });
};
export const cmdSubManager = newCmdSubscriberManager();
