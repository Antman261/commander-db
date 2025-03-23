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
        // await delay(50);
        await end();
        await delay(50);
      },
      2000,
    ),
  );
});
'';
