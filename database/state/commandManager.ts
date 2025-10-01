import { CommandPending, CommandRunning } from '@db/type';
import { JnlEntry, jnlEntryKind } from '@db/jnl';
import { JournalConsumer } from '../journal/journalConsumer.ts';

type PendingCommands = Map<bigint, CommandPending>;
type RunningCommands = Map<bigint, CommandRunning>;
type State = {
  pending: PendingCommands;
  running: RunningCommands;
};

export const commandState = new (class CommandState extends JournalConsumer<State> {
  consumerPathComponent = 'cmds';
  getInitialState(): State {
    return { pending: new Map(), running: new Map() };
  }
  state: State;
  constructor() {
    super();
    this.state = this.getInitialState();
  }
  async readEntry(entry: JnlEntry, pageNo: number) {
    // todo
    switch (entry.k) {
      case jnlEntryKind.cmdIssued: {
        const command = entry.cmd;
        this.state.pending.set(command.id, command);
        break;
      }
      case jnlEntryKind.cmdStarted: {
        const { cmdId } = entry;
        const command = this.state.pending.get(cmdId);
        this.state.pending.delete(cmdId);
        this.state.running.set(cmdId, command);
      }
    }
  }
})();
