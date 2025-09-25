import { ensureFile } from '@std/fs';
import { configManager } from '../config.ts';
import { BinaryDecodeStream } from '@fe-db/proto';
import { readJsonFile, readTextFile, tryOpenFile, writeTextFile } from '@db/disk';
import { JnlEntry } from '@db/jnl';
import { commandState } from '@db/state';
import { delay } from '@std/async/delay';
import { LifecycleComponent } from '@antman/lifecycle';

type Snapshot = Record<'pageNo' | 'seekPos', number>;

export abstract class JournalConsumer extends LifecycleComponent {
  abstract readEntry(entry: JnlEntry, pageNo: number): Promise<void>;
  abstract saveSnapshot(pageNo: number): Promise<void>;
  abstract loadSnapshot(pageNo: number): Promise<void>;
}

export const journalReader = new (class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #mainLoopPromise = Promise.resolve();
  #isRunning = false;
  checkHealth: undefined;
  get #dirPath() {
    return `${configManager.cfg.DATA_DIRECTORY}/jnl`;
  }
  get #snapPath() {
    return `${this.#dirPath}/snap`;
  }
  constructor() {
    super();
  }
  async start() {
    this.registerChildComponent(commandState);
    await this.#loadSnapshot();
    await this.startChildComponents();
    this.#mainLoopPromise = this.#mainLoop();
  }
  async close() {
    this.#isRunning = false;
    await this.#mainLoopPromise;
  }
  async #mainLoop() {
    this.#isRunning = true;
    const snapshotInterval = Number(configManager.cfg.SNAPSHOT_INTERVAL);
    let counter = 0;
    while (this.#isRunning) {
      await this.#readPage();
      counter = (counter + 1) % snapshotInterval;
      if (counter === 0) await this.#saveSnapshot();
      this.#pageNo++;
    }
  }
  async #readPage() {
    const currentPage = await tryOpenFile(`${this.#dirPath}/${this.#pageNo}`, { read: true });
    if (currentPage instanceof Error) return await delay(3);
    const pageStream = currentPage.readable.pipeThrough(BinaryDecodeStream<JnlEntry>());

    const children: readonly JournalConsumer[] = this.getChildren() as readonly JournalConsumer[];
    for await (const [entry] of pageStream) {
      await Promise.all(children.map(readEntry(entry, this.#pageNo)));
    }
    currentPage.close();
  }
  async #loadSnapshot(): Promise<void> {
    await ensureFile(this.#snapPath);
    const { pageNo } = await readJsonFile<Snapshot>(this.#snapPath) ?? { pageNo: 0 };
    this.#pageNo = pageNo;
    this.#getConsumers().map(loadSnapshot(pageNo));
  }
  async #saveSnapshot() {
    const children: readonly JournalConsumer[] = this.getChildren() as readonly JournalConsumer[];
    await Promise.all(children.map(takeSnapshot(this.#pageNo)));
    // snapshots need to all fail or all complete -- could potentially solve this problem by providing a page number with the snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
    await writeTextFile(this.#snapPath, JSON.stringify({ pageNo: this.#pageNo }));
  }
  #getConsumers(): Readonly<JournalConsumer[]> {
    return this.getChildren() as readonly JournalConsumer[];
  }
})();

const takeSnapshot = (pageNo: number) => (component: JournalConsumer) => component.saveSnapshot(pageNo);
const loadSnapshot = (pageNo: number) => (component: JournalConsumer) => component.loadSnapshot(pageNo);
const readEntry = (entry: JnlEntry, pageNo: number) => (component: JournalConsumer) =>
  component.readEntry(entry, pageNo);
