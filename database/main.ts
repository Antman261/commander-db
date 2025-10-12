import { newLifecycleRoot } from '@antman/lifecycle';
import { connectionManager } from '@db/net';
import { configManager } from '@db/cfg';
import { journalReader, journalWriter } from '@db/jnl';

const initializeDatabase = async () => {
  const lifecycle = newLifecycleRoot();
  lifecycle.all(console.log);
  lifecycle.register(configManager);
  lifecycle.register(journalReader);
  lifecycle.register(journalWriter);
  lifecycle.register(connectionManager);
  await lifecycle.start();
};
if (import.meta.main) {
  initializeDatabase();
}
