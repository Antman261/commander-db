import { newJournalConsumer } from '@db/jnl';
import { getInitialState, reduceCommandState, State } from './reduceCommandState.ts';

export const getActiveStreams = (): EntityStream => {
  return Object.values(commandState.state);
};

export const commandState = newJournalConsumer<State>({
  name: 'CommandState',
  pathShorthand: 'cmds',
  reducer: reduceCommandState,
  getInitialState,
});
