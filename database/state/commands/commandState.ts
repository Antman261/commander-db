import { newJournalConsumer } from '@db/jnl';
import { reduceCommandState, State } from './reduceCommandState.ts';

export type CommandState = {};

export const commandState = newJournalConsumer<State, CommandState>({
  name: 'CommandState',
  pathShorthand: 'cmds',
  reducer: reduceCommandState,
  getInitialState: () => ({ pending: new Map(), running: new Map() }),
});
