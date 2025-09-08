import { ensureFile } from '@std/fs';
import { main } from '../config.ts';
import { LifecycleComponent } from '@antman/lifecycle';
import { BinaryDecodeStream } from '@fe-db/proto';
import { JnlEntry } from '@db/jnl';

type Snapshot = Record<'pageNo' | 'seekPos', number>;

export const journalReader = new (class JournalReader extends LifecycleComponent {
  #pageNo = -1;
  #seekPos = -1;
  dirPath = `${main.cfg.DATA_DIRECTORY}/jnl`;
  snapPath = `${this.dirPath}/snap/reader.snp`;
  #currentPage?: Deno.FsFile;
  #streamPromise?: Promise<void>;
  #status: 'pending' | 'running' | 'closing' | 'closed' = 'pending';
  async start() {
    await this.#loadSnapshot();
  }
  async #readPages() {
    while (this.#status === 'running') {
      await this.#readPage();
      this.#pageNo++;
    }
  }
  async #readPage() {
    this.#currentPage = await Deno.open(`${this.dirPath}/${this.#pageNo}`, { read: true });
    await this.#currentPage.seek(this.#seekPos, Deno.SeekMode.Start);
    const pageStream = this.#currentPage.readable.pipeThrough(BinaryDecodeStream<JnlEntry>());

    for await (const entry of pageStream) {
      this.#emit(entry);
    }
  }
  async #loadSnapshot(): Promise<void> {
    await ensureFile(this.snapPath);
    const snapText = await Deno.readTextFile(this.snapPath);
    const { pageNo, seekPos } = snapText !== '' ? parseSnapshot(snapText) : { pageNo: 0, seekPos: 0 };
    this.#seekPos = seekPos;
    this.#pageNo = pageNo;
  }
  async #listPages(): Promise<number[]> {
    const paths: number[] = [];
    for await (const e of Deno.readDir(this.dirPath)) e.isFile && paths.push(Number(e.name));
    return paths.sort((a, b) => a - b);
  }
})();

function parseSnapshot(snapText: string): Snapshot {
  return JSON.parse(snapText);
}
