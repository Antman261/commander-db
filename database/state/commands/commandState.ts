import { newJournalConsumer } from '@db/jnl';
import { EntityStream, getInitialState, reduceCommandState, State } from './reduceCommandState.ts';

export const getActiveStreams = (): EntityStream[] => {
  return Object.values(commandState.state.streams);
};

export const commandState = newJournalConsumer<State>({
  name: 'CommandState',
  pathShorthand: 'cmds',
  reducer: reduceCommandState,
  getInitialState,
});
