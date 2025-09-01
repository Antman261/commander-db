import { type Component } from '@db/lifecycle';
import { CommandInputMessage, UInt16, UInt8 } from '@fe-db/proto';
import { cmdKind, cmdStatus, CommandPending } from '@db/type';
import { generateUuidV7 } from '@db/utl';
import { main } from '../config.ts';
import { JnlEntryInput, jnlEntryKind } from '@db/jnl';
import { serialize } from 'node:v8';

const pageHandleOpts: Deno.OpenOptions = { append: true, create: true };

export const journalWriter = new (class JournalWriter implements Component {
  name: 'JournalWriter';
  pageNo: number;
  dirPath: string;
  status: 'pending' | 'running' | 'crashed';
  #currentPage?: Deno.FsFile;
  #nextPage?: Deno.FsFile;
  constructor() {
    this.name = 'JournalWriter';
    this.status = 'pending';
    this.dirPath = `${main.cfg.DATA_DIRECTORY}/jnl`;
    this.pageNo = 0;
  }
  async start() {
    await this.#initJournalDirectories();
    const paths = await this.#listPages();
    // deno-lint-ignore no-non-null-assertion
    this.pageNo = paths.length === 1 ? paths.at(-1)! : paths.at(-2) ?? 0;
    this.#currentPage = await this.#openPage();
    this.#nextPage = await this.#openPage(1);
  }
  async #initJournalDirectories() {
    await Deno.mkdir(`${this.dirPath}/archive`, { recursive: true });
  }
  async #listPages(): Promise<number[]> {
    const paths: number[] = [];
    for await (const e of Deno.readDir(this.dirPath)) e.isFile && paths.push(Number(e.name));
    return paths.sort();
  }
  async #openPage(offset = 0) {
    return await Deno.open(`${this.dirPath}/${this.pageNo + offset}`, pageHandleOpts);
  }
  async close() {
    // .
  }
  getStatus() {
    return Promise.resolve(this.status);
  }
  async #writeEntry(entry: JnlEntryInput) {
    if (!this.#currentPage) throw new Error('Attempted to write before journal writer initialized');
    await this.#currentPage.write(serialize(entry));
    await this.#currentPage.syncData();
  }
  async writeCommand(cmd: CommandInputMessage, connId: string) {
    await this.#writeEntry({
      k: jnlEntryKind.cmdIssued,
      cmd: adaptCommandInput(cmd),
      connId,
    });
  }
})();

const adaptCommandInput = (command: CommandInputMessage): CommandPending => ({
  id: command.id ?? generateUuidV7(),
  kind: cmdKind.standard,
  status: cmdStatus.pending,
  metadata: {}, // todo inject open telemetry context
  runs: new UInt8(0),
  maxRuns: new UInt8(3),
  runCooldownMs: new UInt8(2000),
  runTimeoutSeconds: new UInt8(5),
  cacheDurationHours: new UInt16(96),
  createdAt: Date.now(),
  ...command,
  runAfter: command.runAfter?.getTime() ?? Date.now(),
});
