import { LifecycleComponent } from '@antman/lifecycle';
import { configManager } from '../config.ts';
import { readJsonFile, removeFile, writeJsonFileClean } from '../disk/file.ts';
import { JnlEntry } from './entries.ts';

export abstract class JournalConsumer<T> extends LifecycleComponent {
  abstract readonly consumerPathComponent: string;

  abstract getInitialState(): T;
  abstract state: T;
  get #dirPath() {
    return `${configManager.cfg.DATA_DIRECTORY}/state/${this.consumerPathComponent}/`;
  }
  get #snapPath() {
    return `${this.#dirPath}/snap`;
  }
  #toSnapPath(pageNo: number) {
    return `${this.#snapPath}/${pageNo}`;
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
  abstract readEntry(entry: JnlEntry, pageNo: number): Promise<void>;
  async saveSnapshot(pageNo: number): Promise<void> {
    await writeJsonFileClean(this.#toSnapPath(pageNo), this.state);
    const defunctPageNo = pageNo - 2;
    if (defunctPageNo > -1) await removeFile(this.#toSnapPath(defunctPageNo));
  }
  async loadSnapshot(pageNo: number): Promise<void> {
    this.state = await readJsonFile<T>(this.#toSnapPath(pageNo)) ?? this.getInitialState();
  }
}
