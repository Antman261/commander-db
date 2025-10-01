import { Lifecycle } from '@antman/lifecycle';
import { connectionManager } from '@db/net';
import { configManager } from './config.ts';
import { journalReader, journalWriter } from '@db/jnl';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log(Deno.args);
  const lifecycle = new Lifecycle();
  lifecycle.all(console.log);
  lifecycle.register(configManager);
  lifecycle.register(journalWriter);
  lifecycle.register(journalReader);
  lifecycle.register(connectionManager);
  await lifecycle.start();
}
