import { LifecycleComponent } from '@antman/lifecycle';
import { CommandPending } from '@db/type';
import { journalReader } from '@db/jnl';

export const commandManager = new (class CommandManager extends LifecycleComponent {
  #commands: Record<string, CommandPending> = {};
  async start() {
    journalReader.registerSnapshotter(this.)
  }
})();
