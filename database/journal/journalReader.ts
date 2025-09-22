import { ensureFile } from '@std/fs';
import { main } from '../config.ts';
import { LifecycleComponent } from '@antman/lifecycle';
import { BinaryDecodeStream } from '@fe-db/proto';
import { JnlEntry } from '@db/jnl';
import { callWith } from '@antman/formic-utils';

type Snapshot = Record<'pageNo' | 'seekPos', number>;

export const journalReader = new (class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #snapshotInterval = Number(main.cfg.SNAPSHOT_INTERVAL);
  #snapshotCallbacks: (() => Promise<void>)[] = [];
  #entryCallbacks: ((entry: JnlEntry) => Promise<void>)[] = [];
  dirPath = `${main.cfg.DATA_DIRECTORY}/jnl`;
  snapPath = `${this.dirPath}/snap/reader.snp`;
  #currentPage?: Deno.FsFile;
  #snapshotPromise?: Promise<void>;
  #mainLoopPromise = Promise.resolve();
  #status: 'pending' | 'running' | 'closing' | 'closed' = 'pending';
  checkHealth: undefined;
  async start() {
    await this.#loadSnapshot();
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
        await Promise.all(this.#snapshotCallbacks.map(callWith()));
        // snapshots need to all fail or all completev-- could potentially solve this problem by providing a page number with the snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
        await this.#saveSnapshot();
      }
      await this.#readPage();
      this.#pageNo++;
    }
  }
  async #readPage() {
    this.#currentPage = await Deno.open(`${this.dirPath}/${this.#pageNo}`, { read: true });
    const pageStream = this.#currentPage.readable.pipeThrough(BinaryDecodeStream<JnlEntry>());

    for await (const [entry] of pageStream) {
      await Promise.all(this.#entryCallbacks.map(callWith(entry)));
    }
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
