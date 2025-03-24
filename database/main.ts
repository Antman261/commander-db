import { connectionManager } from '@db/net';
import { Lifecycle } from '@db/lifecycle';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const lifecycle = new Lifecycle();
  lifecycle.register(connectionManager);
  console.log('db starting');
  await lifecycle.start();
}
