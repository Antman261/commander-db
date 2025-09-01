import { connectionManager } from '@db/net';
import { Lifecycle } from '@db/lifecycle';
import { main } from './config.ts';
import { journalWriter } from '@db/jnl';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log(Deno.args);
  const lifecycle = new Lifecycle();
  lifecycle.all(console.log);
  lifecycle.register(main);
  lifecycle.register(connectionManager);
  lifecycle.register(journalWriter);
  await lifecycle.start();
}
