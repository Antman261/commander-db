import { ensureFile } from '@std/fs';
import { configManager } from '@db/cfg';
import { BinaryDecodeStream } from '@fe-db/proto';
import { readJsonFile, tryOpenFile, writeJsonFileClean } from '@db/disk';
import { JournalEntry } from '@db/jnl';
import { commandState } from '@db/state';
import { delay } from '@std/async/delay';
import { LifecycleComponent } from '@antman/lifecycle';
import type { JournalConsumer } from './journalConsumer.ts';
import { Observed } from '@db/telemetry';

type Snapshot = Record<'pageNo' | 'seekPos', number>;

class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #mainLoopPromise = Promise.resolve();
  #isRunning = false;
  get #dirPath() {
    return `${configManager.cfg.DATA_DIRECTORY}/jnl`;
  }
  get #snapPath() {
    return `${this.#dirPath}/reader.snap`;
  }
  constructor() {
    super();
  }
  @Observed
  async start() {
    this.registerChildComponent(commandState);
    await this.#loadSnapshot();
    await this.startChildComponents();
    this.#mainLoopPromise = this.#mainLoop();
    console.log('commandState.state:', commandState.state);
  }
  @Observed
  async #loadSnapshot(): Promise<void> {
    await ensureFile(this.#snapPath);
    const { pageNo } = await readJsonFile<Snapshot>(this.#snapPath) ?? { pageNo: 0 };
    this.#pageNo = pageNo;
    await Promise.all(this.#getConsumers().map(loadSnapshot(pageNo)));
  }
  @Observed
  async close() {
    this.#isRunning = false;
    await this.#mainLoopPromise;
  }
  @Observed
  async #mainLoop() {
    this.#isRunning = true;
    const snapshotInterval = Number(configManager.cfg.SNAPSHOT_INTERVAL);
    let counter = 0;
    while (this.#isRunning) {
      const didReadPage = await this.#readPage();
      if (didReadPage === false) {
        await delay(3);
        continue;
      }
      counter = (counter + 1) % snapshotInterval;
      if (counter === 0) await this.#saveSnapshot();
      this.#pageNo++;
    }
  }
  @Observed
  async #readPage(): Promise<boolean> {
    const path = `${this.#dirPath}/data/${this.#pageNo}`;
    console.log({ path });
    const currentPage = await tryOpenFile(path, { read: true });
    if (currentPage instanceof Error) return false;
    const pageStream = currentPage.readable.pipeThrough(BinaryDecodeStream<JournalEntry>());

    const consumer = this.#getConsumers();
    for await (const [entry] of pageStream) {
      consumer.map(readEntry(entry));
    }
    pageStream.cancel();
    return true;
  }
  @Observed
  async #saveSnapshot() {
    await Promise.all(this.#getConsumers().map(takeSnapshot(this.#pageNo)));
    // snapshots need to all fail or all complete -- could potentially solve this problem by providing a page number with the snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
    await writeJsonFileClean(this.#snapPath, JSON.stringify({ pageNo: this.#pageNo }));
  }
  #getConsumers(): Readonly<JournalConsumer<unknown>[]> {
    return this.getChildren() as readonly JournalConsumer<unknown>[];
  }
}

export const journalReader = new JournalReader(); // stream be right back

const takeSnapshot = (pageNo: number) => (component: JournalConsumer<unknown>) =>
  component.saveSnapshot(pageNo);
const loadSnapshot = (pageNo: number) => (component: JournalConsumer<unknown>) =>
  component.loadSnapshot(pageNo);
const readEntry = (entry: JournalEntry) => (component: JournalConsumer<unknown>) =>
  component.processEntry(entry);
