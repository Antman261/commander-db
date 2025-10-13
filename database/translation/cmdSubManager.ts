import { delay } from '@std/async';
import { is, isUndefined } from '@antman/formic-utils';
import { LifecycleComponent } from '@antman/lifecycle';
import { CommandMessage, DbMessage } from '@fe-db/proto';
import { CommandSubscriber } from './CommandSubscriber.ts';

export type Candidate = {
  id: string;
  sendMsg<M extends DbMessage>(cmd: M): void;
  maxConcurrentCmds: number;
  commitHash?: string;
};

const subscribers: Record<string, CommandSubscriber> = {};
const subscriberCircle: CommandSubscriber[] = [];
let nextIdx = 0;
const incrementCircleIndex = () => (nextIdx + 1) % subscriberCircle.length;
const limitCircleIndex = () => {
  const length = subscriberCircle.length;
  if (length === 0) return;
  if (is(nextIdx).not.lessThan(length)) nextIdx = length - 1;
};

const registerCommandSubscriber = (c: Candidate): void => {
  // todo: add validation, e.g. not already subscribed
  subscriberCircle.push(subscribers[c.id] = new CommandSubscriber(c));
};

const deregisterCommandSubscriber = async (id: Candidate['id']): Promise<void> => {
  // todo: add validation, e.g. subscription exists, isn't currently processing command
  const subscriber = subscribers[id];
  subscriberCircle.splice(subscriberCircle.indexOf(subscriber), 1);
  await subscriber.deregister();
  delete subscribers[id];
  limitCircleIndex();
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

const onCommandResult = (id: Candidate['id']): void => subscribers[id].onCommandResult();
export const cmdSubManager = {
  registerCommandSubscriber,
  deregisterCommandSubscriber,
  dispatchCommand,
  onCommandResult,
};
