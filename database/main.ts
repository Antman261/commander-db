import { connectionManager } from '@db/net';
import { Lifecycle } from '@antman/lifecycle';
import { main } from './config.ts';
import { journalReader, journalWriter } from '@db/jnl';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log(Deno.args);
  const lifecycle = new Lifecycle();
  lifecycle.all(console.log);
  lifecycle.register(main);
  lifecycle.register(connectionManager);
  lifecycle.register(journalWriter);
  lifecycle.register(journalReader);
  lifecycle.register(commandManager); // TODO: Implement me!
  await lifecycle.start();
}
