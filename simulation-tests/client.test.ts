import { expect } from '@std/expect';
import { simLog } from './utils/log.ts';
import { makeSimTest } from './utils/harness/makeTestFrame.ts';

Deno.test(
  'Client request response',
  makeSimTest({
    databases: [{}],
    clients: [{ name: 'counter' }],
  })(async ({ simCtx }) => {
    const [client] = simCtx.clientInstances;
    const r = await client.sendRequest('/');
    const response = await r.text();
    simLog({ response });
    expect(response).toEqual('huh?');
    await simCtx.cleanup();
  }),
);
