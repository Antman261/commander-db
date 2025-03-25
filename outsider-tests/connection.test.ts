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
        const { subscribeToCommands } = await initFerrousClient();
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
        const sub = await client.subscribeToCommands((cmd: any): Promise<any[]> => {
          events.push(`test-client${idx}: command received ${cmd}`);
          return Promise.resolve([]);
        });
        events.push(`test-client${idx}: subscribed`);
        return sub;
      });
      const subs = await Promise.all(subPromises);
      subs.reverse().map((_, idx) => {
        events.push(`test-client${subs.length - idx}: unsubscribed`);
      });
      console.log(events);
      // await delay(50);
      await end();
      await delay(50);
      expect(events).toEqual([]);
    },
    2000,
  ),
);
