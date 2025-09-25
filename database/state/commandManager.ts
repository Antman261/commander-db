import { CommandPending } from '@db/type';
import { JnlEntry, JournalConsumer } from '@db/jnl';
import { configManager } from '../config.ts';
import { readJsonFile, writeJsonFile } from '@db/disk';

type CommonState = Record<string, CommandPending>;

export const commandState = new (class CommandState extends JournalConsumer {
  get #dirPath() {
    return `${configManager.cfg.DATA_DIRECTORY}/state/cmds/`;
  }
  get #snapPath() {
    return `${this.#dirPath}/snap`;
  }
  #toSnapPath(pageNo: number) {
    return `${this.#snapPath}/${pageNo}`;
  }
  #commands: Record<string, CommandPending> = {};
  checkHealth: undefined;
  start() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  async readEntry(entry: JnlEntry, pageNo: number) {
    // todo
  }
  async saveSnapshot(pageNo: number): Promise<void> {
    await writeJsonFile(this.#toSnapPath(pageNo), this.#commands);
    const defunctPageNo = pageNo - 2;
    if (defunctPageNo > -1) await deleteFile(this.#toSnapPath(defunctPageNo));
  }
  async loadSnapshot(pageNo: number) {
    this.#commands = await readJsonFile<CommonState>(this.#toSnapPath(pageNo)) ?? {};
  }
})();
