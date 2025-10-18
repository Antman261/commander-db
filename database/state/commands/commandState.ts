import { newJournalConsumer } from '@db/jnl';
import { EntityStream, getInitialState, reduceCommandState, State } from './reduceCommandState.ts';
import { Command } from '@db/type';

export const getActiveStreams = (): EntityStream[] => {
  return Object.values(commandState.state.streams);
};

export const getCommand = (id: Command['id']): Command => tryGetCommand(id)!;
export const tryGetCommand = (id: Command['id']): Command | undefined => commandState.state.cmds.get(id);

export const commandState = newJournalConsumer<State>({
  name: 'CommandState',
  pathShorthand: 'cmds',
  reducer: reduceCommandState,
  getInitialState,
});
