import { LifecycleNode } from '@antman/lifecycle';
import { configManager } from '@db/cfg';
import { removeFile, tryReadJsonFile, writeJsonFileClean } from '@db/disk';
import { JournalEntry } from './entries.ts';
import { Obj } from '@antman/formic-utils';
import { withTelemetry } from '@db/telemetry';

type Reducer<State> = (state: State, entry: JournalEntry) => void;

export type JournalConsumer<State> = LifecycleNode & {
  processEntry(entry: JournalEntry): void;
  saveSnapshot(pageNo: number): Promise<void>;
  loadSnapshot(pageNo: number): Promise<void>;
  readonly state: State;
};

type NewConsumer<S> = {
  name: string;
  pathShorthand: string;
  reducer: Reducer<S>;
  getInitialState: () => S;
};
export const newJournalConsumer = <State extends Obj, T = Obj>(
  cfg: NewConsumer<State> & T,
): JournalConsumer<State> & T => {
  const toSnapPath = (pageNo: number) =>
    `${configManager.get('DATA_DIRECTORY')}/state/${cfg.pathShorthand}/snap/${pageNo}`;
  const state = cfg.getInitialState();
  const reducer = withTelemetry(cfg.reducer, `${cfg.name}.reducer`);
  return {
    state,
    start: () => Promise.resolve(),
    close: () => Promise.resolve(),
    ...cfg,
    processEntry(entry: JournalEntry): void {
      reducer(state, entry);
    },
    async saveSnapshot(pageNo: number): Promise<void> {
      await writeJsonFileClean(toSnapPath(pageNo), state);
      const defunctPageNo = pageNo - 2;
      if (defunctPageNo > -1) await removeFile(toSnapPath(defunctPageNo));
    },
    async loadSnapshot(pageNo: number): Promise<void> {
      const result = await tryReadJsonFile<State>(toSnapPath(pageNo));
      if (result instanceof Error) return;
      Object.assign(state, result);
    },
  };
};
