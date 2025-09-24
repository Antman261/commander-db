import { ensureFile } from '@std/fs';
import { configManager } from '../config.ts';
import { LifecycleComponent } from '@antman/lifecycle';
import { BinaryDecodeStream } from '@fe-db/proto';
import { tryOpenFile } from '@db/disk';
import { JnlEntry } from '@db/jnl';
import { commandManager } from '@db/state';
import { callWith } from '@antman/formic-utils';
import { delay } from '@std/async/delay';

type Snapshot = Record<'pageNo' | 'seekPos', number>;
type Snapshotter = (pageNo: number) => Promise<void>;
type EntryReader = (entry: JnlEntry) => Promise<void>;

export const journalReader = new (class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #snapshotInterval = Number(configManager.cfg.SNAPSHOT_INTERVAL);
  #snapshotters: Snapshotter[] = [];
  #entryReaders: EntryReader[] = [];
  dirPath = `${configManager.cfg.DATA_DIRECTORY}/jnl`;
  snapPath = `${this.dirPath}/snap/reader.snp`;
  #snapshotPromise?: Promise<void>;
  #mainLoopPromise = Promise.resolve();
  #status: 'pending' | 'running' | 'closing' | 'closed' = 'pending';
  checkHealth: undefined;
  constructor() {
    super();
  }
  registerSnapshotter(sp: Snapshotter) {
    this.#snapshotters.push(sp);
  }
  registerEntryReader(r: EntryReader) {
    this.#entryReaders.push(r);
  }
  async start() {
    await this.#loadSnapshot();
    this.register(commandManager);
    await this.startChildren();
    this.#status = 'running';
    this.#mainLoopPromise = this.#mainLoop();
  }
  async close() {
    this.#status = 'closing';
    // Don't want the JournalReader to take a snapshot during shutdown in case it gets interrupted, but any pending snapshot needs to be completed
    await Promise.all([
      this.#snapshotPromise,
      this.#mainLoopPromise,
    ]);
    this.#status = 'closed';
  }
  async #mainLoop() {
    let counter = 0;
    while (this.#status === 'running') {
      counter = (counter + 1) % this.#snapshotInterval;
      if (counter === 0) {
        await Promise.all(this.#snapshotters.map(callWith(this.#pageNo)));
        // snapshots need to all fail or all completev-- could potentially solve this problem by providing a page number with the snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
        await this.#saveSnapshot();
      }
      await this.#readPage();
    }
  }
  async #readPage() {
    const currentPage = await tryOpenFile(`${this.dirPath}/${this.#pageNo}`, { read: true });
    if (currentPage instanceof Error) {
      await delay(3);
      return;
    }
    const pageStream = currentPage.readable.pipeThrough(BinaryDecodeStream<JnlEntry>());

    for await (const [entry] of pageStream) {
      await Promise.all(this.#entryReaders.map(callWith(entry)));
    }
    currentPage.close();
    this.#pageNo++;
  }
  async #loadSnapshot(): Promise<void> {
    await ensureFile(this.snapPath);
    const snapText = await Deno.readTextFile(this.snapPath);
    const { pageNo } = snapText !== '' ? parseSnapshot(snapText) : { pageNo: 0 };
    this.#pageNo = pageNo;
  }
  async #saveSnapshot() {
    await Deno.writeTextFile(this.snapPath, JSON.stringify({ pageNo: this.#pageNo }));
  }
})();

function parseSnapshot(snapText: string): Snapshot {
  return JSON.parse(snapText);
}
