import { setupTest } from './__tests__/mocks/mod.ts';

// Deno.test('connections', async ({ step }) => {

const { client, end } = await setupTest();
// await step('sends message', async () => {
await client.requestCommandSubscription();
alert('Ready to disconnect?');
await client.closeConnection();
// });
await end();
// });
