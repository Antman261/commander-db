import { expect } from '@std/expect';
import { makeSimTest } from './utils/harness/makeTestFrame.ts';
import { delay } from '@std/async';

const withSim = makeSimTest({
  databases: [{}],
  clients: [{ name: 'counter' }],
});

Deno.test(
  'issue a command, get back a response',
  withSim(async ({ simCtx }) => {
    const [client] = simCtx.clientInstances;
    const { status, json } = await client.post('/counters', { name: 'ducks' });
    expect(status).toEqual(200);
    expect(json).toEqual({ outcome: 'command issued' });
    const res = await client.get('/counters');
    await delay(5000);
    expect(res.json).toEqual({ ducks: 0 });
  }),
);
