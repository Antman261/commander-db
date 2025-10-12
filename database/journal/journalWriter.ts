import { LifecycleNode } from '@antman/lifecycle';
import { CommandInputMessage, jsBinaryEncode, UInt16, UInt8 } from '@fe-db/proto';
import { cmdKind, cmdStatus, CommandPending } from '@db/type';
import { generateUuidV7 } from '@db/utl';
import { configManager } from '@db/cfg';
import { entryKind, JournalEntry, journalReader } from '@db/jnl';
import { tryMakeDir } from '@db/disk';
import { withTelemetry } from '@db/telemetry';

const pageHandleOpts: Deno.OpenOptions = { append: true, create: true };

type JournalWriter = LifecycleNode & {
  writeCommand(cmd: CommandInputMessage, connId: string): Promise<bigint>;
};
export const journalWriter: JournalWriter = (() => {
  let pageNo = 0;
  let dirPath: string;
  let archivePath: string;
  let dataPath: string;
  let currentPage: Deno.FsFile;
  let nextPage: Deno.FsFile;
  const binaryEncoder = jsBinaryEncode();
  const initJournalDirectories = withTelemetry(async (): Promise<void> => {
    await Promise.all([tryMakeDir(archivePath), tryMakeDir(dataPath)]);
  }, 'JournalWriter.initJournalDirectories');
  const listPages = withTelemetry(async (): Promise<number[]> => {
    const paths: number[] = [];
    for await (const e of Deno.readDir(dataPath)) {
      e.isFile && paths.push(Number(e.name));
    }
    return paths.sort((a, b) => a - b);
  }, 'JournalWriter.listPages');
  const startNextPage = withTelemetry(async () => {
    pageNo += 1;
    currentPage?.close();
    currentPage = nextPage;
    nextPage = await openPage(1);
  }, 'JournalWriter.startNextPage');
  const closePages = () => {
    currentPage?.close();
    nextPage?.close();
  };
  const openPage = withTelemetry(
    async (offset = 0) => await Deno.open(`${dataPath}/${pageNo + offset}`, pageHandleOpts),
    'JournalWriter.openPage',
  );
  const writeEntry = withTelemetry(async (entry: JournalEntry) => {
    if (!currentPage) throw new Error('Attempted to write before journal writer initialized');
    await currentPage.write(binaryEncoder(entry));
    await currentPage.syncData();
    journalReader.processEntry(entry); // todo: decide if send buf or entry
    const isPageFull = false; // todo: determine when the page is full
    if (isPageFull) {
      await journalReader.checkSnapshotInterval(pageNo);
      await startNextPage();
    }
    // todo implement system to change to the next pageirg
  }, 'JournalWriter.writeEntry');
  return {
    name: 'JournalWriter',
    start: withTelemetry(async () => {
      dirPath = `${configManager.get('DATA_DIRECTORY')}/jnl`;
      dataPath = `${dirPath}/data`;
      archivePath = `${dirPath}/archive`;
      await initJournalDirectories();
      const paths = await listPages();
      // deno-lint-ignore no-non-null-assertion
      pageNo = paths.length === 1 ? paths.at(-1)! : paths.at(-2) ?? 0;
      currentPage = await openPage();
      nextPage = await openPage(1);
    }, 'JournalWriter.start'),
    close: withTelemetry(() => {
      closePages();
      // todo
      return Promise.resolve();
    }, 'JournalWriter.close'),
    writeCommand: withTelemetry(async (cmd, connId) => {
      const command = adaptCommandInput(cmd);
      // todo: check command idempotency cache for command id
      await writeEntry({
        k: entryKind.cmdIssued,
        cmd: command,
        connId,
        writtenAt: Date.now(),
      });
      return command.id;
    }, 'JournalWriter.writeCommand'),
  };
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
