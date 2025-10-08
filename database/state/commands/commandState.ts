import { JournalConsumer } from '@db/jnl';
import { reduceCommandState, State } from './reduceCommandState.ts';

class CommandState extends JournalConsumer<State> {
  consumerPathComponent = 'cmds';
  getInitialState(): State {
    return { pending: new Map(), running: new Map() };
  }
  readonly state: State;
  constructor() {
    super();
    this.state = this.getInitialState();
    this.registerReducer(reduceCommandState);
  }
}
export const commandState = new CommandState();
