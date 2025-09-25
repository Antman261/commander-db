import { ensureFile } from '@std/fs';
import { configManager } from '../config.ts';
import { BinaryDecodeStream } from '@fe-db/proto';
import { tryOpenFile } from '@db/disk';
import { JnlEntry } from '@db/jnl';
import { commandManager } from '@db/state';
import { delay } from '@std/async/delay';
import { LifecycleComponent } from '@antman/lifecycle';

type Snapshot = Record<'pageNo' | 'seekPos', number>;

export abstract class JournalConsumer extends LifecycleComponent {
  abstract readEntry(entry: JnlEntry, pageNo: number): Promise<void>;
  abstract saveSnapshot(pageNo: number): Promise<void>;
}

export const journalReader = new (class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #mainLoopPromise = Promise.resolve();
  #isRunning = false;
  checkHealth: undefined;
  get dirPath() {
    return `${configManager.cfg.DATA_DIRECTORY}/jnl`;
  }
  get snapPath() {
    return `${this.dirPath}/snap/reader.snp`;
  }
  constructor() {
    super();
  }
  async start() {
    await this.#loadSnapshot();
    this.registerChildComponent(commandManager);
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
    const currentPage = await tryOpenFile(`${this.dirPath}/${this.#pageNo}`, { read: true });
    if (currentPage instanceof Error) return await delay(3);
    const pageStream = currentPage.readable.pipeThrough(BinaryDecodeStream<JnlEntry>());

    const children: readonly JournalConsumer[] = this.getChildren() as readonly JournalConsumer[];
    for await (const [entry] of pageStream) {
      await Promise.all(children.map(readEntry(entry, this.#pageNo)));
    }
    currentPage.close();
  }
  async #loadSnapshot(): Promise<void> {
    await ensureFile(this.snapPath);
    const snapText = await Deno.readTextFile(this.snapPath);
    const { pageNo } = snapText !== '' ? parseSnapshot(snapText) : { pageNo: 0 };
    this.#pageNo = pageNo;
  }
  async #saveSnapshot() {
    const children: readonly JournalConsumer[] = this.getChildren() as readonly JournalConsumer[];
    await Promise.all(children.map(takeSnapshot(this.#pageNo)));
    // snapshots need to all fail or all complete -- could potentially solve this problem by providing a page number with the snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
    await Deno.writeTextFile(this.snapPath, JSON.stringify({ pageNo: this.#pageNo }));
  }
})();

const takeSnapshot = (pageNo: number) => (component: JournalConsumer) => component.saveSnapshot(pageNo);
const readEntry = (entry: JnlEntry, pageNo: number) => (component: JournalConsumer) =>
  component.readEntry(entry, pageNo);

function parseSnapshot(snapText: string): Snapshot {
  return JSON.parse(snapText);
}
