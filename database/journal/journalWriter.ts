import { LifecycleComponent } from '@antman/lifecycle';
import { CommandInputMessage, jsBinaryEncode, UInt16, UInt8 } from '@fe-db/proto';
import { cmdKind, cmdStatus, CommandPending } from '@db/type';
import { generateUuidV7 } from '@db/utl';
import { configManager } from '@db/cfg';
import { entryKind, JournalEntry } from '@db/jnl';
import { tryMakeDir } from '@db/disk';

const pageHandleOpts: Deno.OpenOptions = { append: true, create: true };

export const journalWriter = new (class JournalWriter extends LifecycleComponent {
  pageNo = 0;
  get dirPath(): string {
    return `${configManager.cfg.DATA_DIRECTORY}/jnl`;
  }
  get archivePath(): string {
    return `${this.dirPath}/archive`;
  }
  get dataPath(): string {
    return `${this.dirPath}/data`;
  }
  #currentPage?: Deno.FsFile;
  #nextPage?: Deno.FsFile;
  #encode = jsBinaryEncode();
  async start() {
    await this.#initJournalDirectories();
    const paths = await this.#listPages();
    // deno-lint-ignore no-non-null-assertion
    this.pageNo = paths.length === 1 ? paths.at(-1)! : paths.at(-2) ?? 0;
    this.#currentPage = await this.#openPage();
    this.#nextPage = await this.#openPage(1);
  }
  async #initJournalDirectories() {
    await Promise.all([tryMakeDir(this.archivePath), tryMakeDir(this.dataPath)]);
  }
  async #listPages(): Promise<number[]> {
    const paths: number[] = [];
    for await (const e of Deno.readDir(this.dataPath)) {
      e.isFile && paths.push(Number(e.name));
    }
    return paths.sort((a, b) => a - b);
  }
  async #openPage(offset = 0) {
    return await Deno.open(`${this.dataPath}/${this.pageNo + offset}`, pageHandleOpts);
  }
  async #writeEntry(entry: JournalEntry) {
    if (!this.#currentPage) throw new Error('Attempted to write before journal writer initialized');
    await this.#currentPage.write(this.#encode(entry));
    await this.#currentPage.sync();
    // todo implement system to change to the next page
  }
  async writeCommand(cmd: CommandInputMessage, connId: string) {
    console.debug('Writing command issued journal entry');
    const command = adaptCommandInput(cmd);
    await this.#writeEntry({
      k: entryKind.cmdIssued,
      cmd: command,
      connId,
      writtenAt: Date.now(),
    });
    console.debug('Command written');
    return command.id;
  }
  // async startCommand
  async close() {
    await this.#currentPage?.close();
    // todo
  }
})();

const adaptCommandInput = (command: CommandInputMessage): CommandPending => ({
  id: command.id ?? generateUuidV7(),
  kind: cmdKind.standard,
  status: cmdStatus.pending,
  metadata: {}, // todo inject open telemetry context
  runs: [],
  maxRuns: new UInt8(3),
  runCooldownMs: new UInt8(2000),
  runTimeoutSeconds: new UInt8(5),
  cacheDurationHours: new UInt16(96),
  createdAt: Date.now(),
  ...command,
  runAfter: command.runAfter?.getTime() ?? Date.now(),
});
