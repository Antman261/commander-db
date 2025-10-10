import { LifecycleComponent } from '@antman/lifecycle';
import { configManager } from '@db/cfg';
import { Observed } from '@db/telemetry';
import { removeFile, tryReadJsonFile, writeJsonFileClean } from '@db/disk';
import { JournalEntry } from './entries.ts';
import { isUndefined } from '@antman/bool';

type Reducer<State> = (state: State, entry: JournalEntry) => void;

export abstract class JournalConsumer<State = unknown> extends LifecycleComponent {
  abstract readonly consumerPathComponent: string;

  protected abstract getInitialState(): State;
  protected abstract state: State;

  #reducer?: Reducer<State>;
  constructor() {
    super();
  }
  protected registerReducer(reducer: Reducer<State>): void {
    this.#reducer = reducer;
  }
  #toSnapPath(pageNo: number) {
    return `${configManager.cfg.DATA_DIRECTORY}/state/${this.consumerPathComponent}/snap/${pageNo}`;
  }
  start(): Promise<void> {
    if (isUndefined(this.#reducer)) {
      throw new Error('Cannot start a derivative of JournalConsumer without registering a reducer');
    }
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
  @Observed
  processEntry(entry: JournalEntry): void {
    this.#reducer?.(this.state, entry);
  }
  @Observed
  async saveSnapshot(pageNo: number): Promise<void> {
    await writeJsonFileClean(this.#toSnapPath(pageNo), this.state);
    const defunctPageNo = pageNo - 2;
    if (defunctPageNo > -1) await removeFile(this.#toSnapPath(defunctPageNo));
  }
  @Observed
  async loadSnapshot(pageNo: number): Promise<void> {
    const result = await tryReadJsonFile<State>(this.#toSnapPath(pageNo));
    if (result instanceof Error) {
      this.state = this.getInitialState();
      return;
    }
    this.state = result ?? this.getInitialState();
  }
}
