// deno-lint-ignore-file no-explicit-any
import { expect } from '@std/expect';
import { deadline, delay } from '@std/async';
import { initFerrousClient } from '@fe-db/client';
import { startDatabaseInstance } from './startDatabaseInstance.ts';

const withDeadline = <Fn extends (...args: never[]) => Promise<unknown>>(fn: Fn, ms: number): Fn =>
  ((...args) => deadline(fn(...args), ms)) as Fn;

Deno.test('basic connection', async ({ step }) => {
  await step(
    'can request a subscription and receive a command',
    withDeadline(
      async () => {
        const { promise, resolve } = Promise.withResolvers();
        const { end } = await startDatabaseInstance();
        const { startCommandSubscription: subscribeToCommands } = await initFerrousClient();
        const { unsubscribe } = await subscribeToCommands(async (cmd: any): Promise<any[]> =>
          resolve(cmd) ?? []
        );
        const receivedCommand = await promise;
        expect(receivedCommand).toEqual({ name: 'hello!' });
        await unsubscribe();
        await end();
        await delay(50);
      },
      2000,
    ),
  );
});

Deno.test(
  'multiple connections', // connections are currently handled sequentially, might use https://jsr.io/@std/async/1.0.11/pool.ts
  withDeadline(
    async () => {
      const { end } = await startDatabaseInstance();
      const client = await initFerrousClient();
      const events: string[] = [];

      const subPromises = Array.from({ length: 50 }).map(async (_, idx) => {
        const sub = await client.startCommandSubscription((cmd: any): Promise<any[]> => {
          events.push(`test-client${idx}: command received ${JSON.stringify(cmd)}`);
          return Promise.resolve([]);
        });
        events.push(`test-client${idx}: subscribed`);
        return sub;
      });
      const subs = await Promise.all(subPromises);

      await delay(50);
      await Promise.all(
        subs.reverse().map(async (sub, idx) => {
          await sub.unsubscribe();
          events.push(`test-client${subs.length - idx}: unsubscribed`);
        }),
      );
      await end();
      expect(events).toEqual([
        'test-client0: subscribed',
        'test-client1: subscribed',
        'test-client2: subscribed',
        'test-client3: subscribed',
        'test-client4: subscribed',
        'test-client5: subscribed',
        'test-client6: subscribed',
        'test-client7: subscribed',
        'test-client8: subscribed',
        'test-client9: subscribed',
        'test-client10: subscribed',
        'test-client11: subscribed',
        'test-client12: subscribed',
        'test-client13: subscribed',
        'test-client14: subscribed',
        'test-client15: subscribed',
        'test-client16: subscribed',
        'test-client17: subscribed',
        'test-client18: subscribed',
        'test-client19: subscribed',
        'test-client20: subscribed',
        'test-client21: subscribed',
        'test-client22: subscribed',
        'test-client23: subscribed',
        'test-client24: subscribed',
        'test-client25: subscribed',
        'test-client26: subscribed',
        'test-client27: subscribed',
        'test-client28: subscribed',
        'test-client29: subscribed',
        'test-client30: subscribed',
        'test-client31: subscribed',
        'test-client32: subscribed',
        'test-client33: subscribed',
        'test-client34: subscribed',
        'test-client35: subscribed',
        'test-client36: subscribed',
        'test-client37: subscribed',
        'test-client38: subscribed',
        'test-client39: subscribed',
        'test-client40: subscribed',
        'test-client41: subscribed',
        'test-client42: subscribed',
        'test-client43: subscribed',
        'test-client44: subscribed',
        'test-client45: subscribed',
        'test-client46: subscribed',
        'test-client47: subscribed',
        'test-client48: subscribed',
        'test-client49: subscribed',
        'test-client0: command received {"name":"hello!"}',
        'test-client1: command received {"name":"hello!"}',
        'test-client2: command received {"name":"hello!"}',
        'test-client3: command received {"name":"hello!"}',
        'test-client4: command received {"name":"hello!"}',
        'test-client5: command received {"name":"hello!"}',
        'test-client6: command received {"name":"hello!"}',
        'test-client7: command received {"name":"hello!"}',
        'test-client8: command received {"name":"hello!"}',
        'test-client9: command received {"name":"hello!"}',
        'test-client10: command received {"name":"hello!"}',
        'test-client11: command received {"name":"hello!"}',
        'test-client12: command received {"name":"hello!"}',
        'test-client13: command received {"name":"hello!"}',
        'test-client14: command received {"name":"hello!"}',
        'test-client15: command received {"name":"hello!"}',
        'test-client16: command received {"name":"hello!"}',
        'test-client17: command received {"name":"hello!"}',
        'test-client18: command received {"name":"hello!"}',
        'test-client19: command received {"name":"hello!"}',
        'test-client20: command received {"name":"hello!"}',
        'test-client21: command received {"name":"hello!"}',
        'test-client22: command received {"name":"hello!"}',
        'test-client23: command received {"name":"hello!"}',
        'test-client24: command received {"name":"hello!"}',
        'test-client25: command received {"name":"hello!"}',
        'test-client26: command received {"name":"hello!"}',
        'test-client27: command received {"name":"hello!"}',
        'test-client28: command received {"name":"hello!"}',
        'test-client29: command received {"name":"hello!"}',
        'test-client30: command received {"name":"hello!"}',
        'test-client31: command received {"name":"hello!"}',
        'test-client32: command received {"name":"hello!"}',
        'test-client33: command received {"name":"hello!"}',
        'test-client34: command received {"name":"hello!"}',
        'test-client35: command received {"name":"hello!"}',
        'test-client36: command received {"name":"hello!"}',
        'test-client37: command received {"name":"hello!"}',
        'test-client38: command received {"name":"hello!"}',
        'test-client39: command received {"name":"hello!"}',
        'test-client40: command received {"name":"hello!"}',
        'test-client41: command received {"name":"hello!"}',
        'test-client42: command received {"name":"hello!"}',
        'test-client43: command received {"name":"hello!"}',
        'test-client44: command received {"name":"hello!"}',
        'test-client45: command received {"name":"hello!"}',
        'test-client46: command received {"name":"hello!"}',
        'test-client47: command received {"name":"hello!"}',
        'test-client48: command received {"name":"hello!"}',
        'test-client49: command received {"name":"hello!"}',
        'test-client50: unsubscribed',
        'test-client49: unsubscribed',
        'test-client48: unsubscribed',
        'test-client47: unsubscribed',
        'test-client46: unsubscribed',
        'test-client45: unsubscribed',
        'test-client44: unsubscribed',
        'test-client43: unsubscribed',
        'test-client42: unsubscribed',
        'test-client41: unsubscribed',
        'test-client40: unsubscribed',
        'test-client39: unsubscribed',
        'test-client38: unsubscribed',
        'test-client37: unsubscribed',
        'test-client36: unsubscribed',
        'test-client35: unsubscribed',
        'test-client34: unsubscribed',
        'test-client33: unsubscribed',
        'test-client32: unsubscribed',
        'test-client31: unsubscribed',
        'test-client30: unsubscribed',
        'test-client29: unsubscribed',
        'test-client28: unsubscribed',
        'test-client27: unsubscribed',
        'test-client26: unsubscribed',
        'test-client25: unsubscribed',
        'test-client24: unsubscribed',
        'test-client23: unsubscribed',
        'test-client22: unsubscribed',
        'test-client21: unsubscribed',
        'test-client20: unsubscribed',
        'test-client19: unsubscribed',
        'test-client18: unsubscribed',
        'test-client17: unsubscribed',
        'test-client16: unsubscribed',
        'test-client15: unsubscribed',
        'test-client14: unsubscribed',
        'test-client13: unsubscribed',
        'test-client12: unsubscribed',
        'test-client11: unsubscribed',
        'test-client10: unsubscribed',
        'test-client9: unsubscribed',
        'test-client8: unsubscribed',
        'test-client7: unsubscribed',
        'test-client6: unsubscribed',
        'test-client5: unsubscribed',
        'test-client4: unsubscribed',
        'test-client3: unsubscribed',
        'test-client2: unsubscribed',
        'test-client1: unsubscribed',
      ]);
    },
    2000,
  ),
);
