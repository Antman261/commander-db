import { CommandInputMessage, jsBinaryEncode, UInt16, UInt8 } from '@fe-db/proto';
import { cmdKind, cmdStatus, CommandPending } from '@db/type';
import { generateUuidV7 } from '@db/utl';
import { configManager } from '../config.ts';
import { JnlEntry, jnlEntryKind } from '@db/jnl';
import { LifecycleComponent } from '@antman/lifecycle';

const pageHandleOpts: Deno.OpenOptions = { append: true, create: true };

export const journalWriter = new (class JournalWriter extends LifecycleComponent {
  pageNo: number;
  dirPath: string;
  #currentPage?: Deno.FsFile;
  #nextPage?: Deno.FsFile;
  #encode = jsBinaryEncode();
  constructor() {
    super();
    this.dirPath = `${configManager.cfg.DATA_DIRECTORY}/jnl`;
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
    await Promise.all([
      Deno.mkdir(`${this.dirPath}/archive`, { recursive: true }),
      Deno.mkdir(`${this.dirPath}/snap`, { recursive: true }),
    ]);
  }
  async #listPages(): Promise<number[]> {
    const paths: number[] = [];
    for await (const e of Deno.readDir(this.dirPath)) e.isFile && paths.push(Number(e.name));
    return paths.sort((a, b) => a - b);
  }
  async #openPage(offset = 0) {
    return await Deno.open(`${this.dirPath}/${this.pageNo + offset}`, pageHandleOpts);
  }
  async #writeEntry(entry: JnlEntry) {
    if (!this.#currentPage) throw new Error('Attempted to write before journal writer initialized');
    await this.#currentPage.write(this.#encode(entry));
    await this.#currentPage.sync();
    // todo implement system to change to the next page
  }
  async writeCommand(cmd: CommandInputMessage, connId: string) {
    await this.#writeEntry({
      k: jnlEntryKind.cmdIssued,
      cmd: adaptCommandInput(cmd),
      connId,
    });
  }
  // async startCommand
  async close() {
    // todo
  }
  checkHealth: undefined;
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
