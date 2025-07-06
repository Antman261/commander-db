import { connectionManager } from '@db/net';
import { Lifecycle } from '@db/lifecycle';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log(Deno.args);
  const lifecycle = new Lifecycle();
  lifecycle.all(console.log);
  lifecycle.register(connectionManager);
  await lifecycle.start();
}
