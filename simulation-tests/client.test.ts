import { expect } from '@std/expect';
import { SimulationTest } from './SimulationTest.ts';
import { simLog } from './utils/log.ts';

Deno.test('Client request response', async () => {
  const test = new SimulationTest({
    databases: [{}],
    clients: [{ name: 'counter' }],
  });
  await test.start();
  const [client] = test.clientInstances;
  const r = await client.sendRequest('/');
  const response = await r.text();
  simLog({ response });
  expect(response).toEqual('huh?');
  // await test.cleanup();
});
