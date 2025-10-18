import { delay } from '@std/async';
import { is, isUndefined } from '@antman/formic-utils';
import { LifecycleNode } from '@antman/lifecycle';
import { CommandResult, DbMessage } from '@fe-db/proto';
import { getActiveStreams } from '@db/state';
import { cmdStatus, CommandPending, CommandRunning } from '@db/type';
import { CommandSubscriber } from './CommandSubscriber.ts';
import { journalWriter } from '@db/jnl';
import { getActiveSpan, setSpanAttributes, withTelemetry } from '@db/telemetry';

export type Candidate = {
  id: string;
  sendMsg<M extends DbMessage>(cmd: M): void;
  maxConcurrentCmds: number;
  commitHash?: string;
};

type CommandSubscriberManager = LifecycleNode & {
  registerCommandSubscriber(c: Candidate): void;
  deregisterCommandSubscriber(id: Candidate['id']): Promise<void>;
  onCommandResult(id: Candidate['id'], result: CommandResult, cmdId: CommandPending['id']): void;
};
const newCmdSubscriberManager = (): CommandSubscriberManager => {
  const subscribers: Record<string, CommandSubscriber> = {};
  const subscriberCircle: CommandSubscriber[] = [];
  let nextIdx = 0;
  const getSubscriberFromCircle = (): CommandSubscriber | undefined => {
    const subscriber = subscriberCircle.at(nextIdx);
    incrementCircleIndex();
    return subscriber;
  };
  const incrementCircleIndex = () =>
    nextIdx = subscriberCircle.length === 0 ? 0 : (nextIdx + 1) % subscriberCircle.length;
  const limitCircleIndex = () => {
    const length = subscriberCircle.length;
    if (length === 0) return;
    if (is(nextIdx).not.lessThan(length)) nextIdx = length - 1;
  };
  const awaitingDispatch = new Set<CommandPending>();
  const dispatchCommand = withTelemetry(async (cmd: CommandPending): Promise<void> => {
    console.log('Dispatching command', cmd.id);
    setSpanAttributes({ 'command.id': cmd.id.toString() });
    awaitingDispatch.add(cmd);
    const msUntilRunAfter = cmd.runAfter - Date.now();
    if (msUntilRunAfter > 0) {
      console.log(`Waiting until ${cmd.runAfter} in ${msUntilRunAfter}ms from ${Date.now()}`);
      await delay(msUntilRunAfter);
    }
    let subscriber: CommandSubscriber | undefined;
    let attempts = 0;
    const attemptLimit = subscriberCircle.length;
    console.log(`Attempting to find subscriber within ${attemptLimit} attempts`);
    do {
      subscriber = getSubscriberFromCircle();
      attempts++;
      if (attempts > attemptLimit) await delay(attempts);
    } while (isUndefined(subscriber) || subscriber.status !== 'free');
    awaitingDispatch.delete(cmd);

    console.log(`Found subscriber ${subscriber.id} for command ${cmd.id}`);

    setSpanAttributes({ 'sub.id': subscriber.id });

    await journalWriter.writeCommandStarted(cmd, subscriber.id);
    console.log('Command started written');
    subscriber.dispatchCommand(cmd);
    console.log('dispatched');
  }, 'CommandSubscriptionManager.dispatchCommand');
  let isRunning = false;
  let mainLoopPromise: Promise<void> | undefined;
  let loopTickStartMs = 0;
  const maxLoopWaitMs = 5;
  const _runTick = async () => {
    loopTickStartMs = Date.now();
    for (const stream of getActiveStreams()) {
      if (isUndefined(stream.headCommand)) continue;
      if (stream.headCommand.status === cmdStatus.running) {
        checkCommandTimeout(stream.headCommand);
        continue;
      }
      if (awaitingDispatch.has(stream.headCommand)) continue;
      dispatchCommand(stream.headCommand);
    }
    const durationMs = Date.now() - loopTickStartMs;
    if (durationMs < maxLoopWaitMs) await delay(maxLoopWaitMs - durationMs);
  };
  const runTick = withTelemetry(_runTick, 'CommandSubscriptionManager.runTick');
  return ({
    name: 'CommandSubscriptionManager',
    start() {
      // todo
      isRunning = true;
      mainLoopPromise = (async () => {
        while (isRunning) await _runTick();
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
    onCommandResult: async (
      id: Candidate['id'],
      result: CommandResult,
      cmdId: CommandPending['id'],
    ): Promise<void> => {
      if (isUndefined(cmdId)) throw new Error(`No matching commandId ${cmdId} for subscriber ${id}`);
      await journalWriter.writeCommandOutcome(cmdId, result, id);
      subscribers[id].onCommandResult();
    },
  });
};
const checkCommandTimeout = async (cmd: CommandRunning) => {
  // @ts-expect-error .
  const runTimeoutMs = cmd.runTimeoutSeconds._value[0] * 1000;
  const expiredAt = cmd.beganAt + runTimeoutMs;
  console.log({
    beganAt: cmd.beganAt,
    r: cmd.runTimeoutSeconds,
    runTimeoutSeconds: cmd.runTimeoutSeconds.value,
    runTimeoutMs: (+cmd.runTimeoutSeconds * 1000),
    expiredAt,
  });
  if (expiredAt < Date.now()) {
    console.log('hasExpired');
    await journalWriter.writeCommandFailed(cmd.id, 'TIME_OUT', cmd.connId);
    console.log('entryWritten');
  }
};
export const cmdSubManager = newCmdSubscriberManager();
