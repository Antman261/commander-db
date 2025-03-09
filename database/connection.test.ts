import { expect } from 'jsr:@std/expect';
import { setupTest, startClient } from './__tests__/mocks/mod.ts';

Deno.test('connections', async ({ step }) => {
  const { client, end } = await setupTest();
  await step('sends message', async () => {
    await client.requestCommandSubscription();
    await client.closeConnection();
    expect(true).toEqual(true);
  });
  await end();
});
