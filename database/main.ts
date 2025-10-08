import { Lifecycle } from '@antman/lifecycle';
import { connectionManager } from '@db/net';
import { configManager } from './config.ts';
import { journalReader, journalWriter } from '@db/jnl';

const initializeDatabase = async () => {
  const lifecycle = new Lifecycle();
  lifecycle.all(console.log);
  lifecycle.register(configManager);
  lifecycle.register(journalWriter);
  lifecycle.register(journalReader);
  lifecycle.register(connectionManager);
  await lifecycle.start();
};
if (import.meta.main) {
  initializeDatabase();
}
