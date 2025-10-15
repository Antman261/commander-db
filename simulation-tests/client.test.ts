import { expect } from '@std/expect';
import { makeSimTest } from './utils/harness/makeTestFrame.ts';
import { delay } from '@std/async';

const withSim = makeSimTest({
  databases: [{}],
  clients: [{ name: 'counter' }],
});
Deno.test(
  'Client request response',
  withSim(async ({ simCtx }) => {
    const [client] = simCtx.clientInstances;
    const { text } = await client.getText('/');
    expect(text).toEqual('Hello Hono!');
  }),
);

Deno.test(
  'issue a command, get back a response',
  withSim(async ({ simCtx }) => {
    const [client] = simCtx.clientInstances;
    const { status, json } = await client.post('/counters', { name: 'ducks' });
    expect(status).toEqual(200);
    expect(json).toEqual({ outcome: 'command issued' });
    await delay(50);
    const res = await client.get('/counters');
    expect(res.json).toEqual({ ducks: 0 });
  }),
);
