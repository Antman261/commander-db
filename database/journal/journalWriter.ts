import { LifecycleNode } from '@antman/lifecycle';
import { CommandInputMessage, CommandResult, jsBinaryEncode } from '@fe-db/proto';
import { configManager } from '@db/cfg';
import { entryKind, JournalEntry, journalReader } from '@db/jnl';
import { tryMakeDir } from '@db/disk';
import { withTelemetry } from '@db/telemetry';
import { toCommandPending } from '@db/translation';
import { CommandPending } from '@db/type';
import { type DistributiveOmit, generateUuidV7 } from '@db/utl';

const pageHandleOpts: Deno.OpenOptions = { append: true, create: true };

type JournalWriter = LifecycleNode & {
  writeCommandIssued(cmd: CommandInputMessage, connId: string): Promise<bigint>;
  writeCommandStarted(cmd: CommandPending, connId: string): Promise<void>;
  writeCommandOutcome(cmdId: CommandPending['id'], result: CommandResult, connId: string): Promise<void>;
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
  const writeEntry = withTelemetry(async (entry: DistributiveOmit<JournalEntry, 'writtenAt'>) => {
    if (!currentPage) throw new Error('Attempted to write before journal writer initialized');
    const e = Object.assign(entry, { writtenAt: Date.now() });
    await currentPage.write(binaryEncoder(e));
    await currentPage.syncData();
    journalReader.processEntry(e); // todo: decide if send buf or entry
    const isPageFull = false; // todo: determine when the page is full
    if (isPageFull) {
      await journalReader.checkSnapshotInterval(pageNo);
      await startNextPage();
    }
    // todo implement system to change to the next page
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
    writeCommandIssued: withTelemetry(async (cmdInput, connId) => {
      const cmd = toCommandPending(cmdInput);
      // todo: check command idempotency cache for command id
      await writeEntry({
        k: entryKind.cmdIssued,
        cmd: cmd,
        id: cmd.id,
        connId,
      });
      return cmd.id;
    }, 'JournalWriter.writeCommand'),
    writeCommandStarted: withTelemetry(async (cmd, connId) => {
      await writeEntry({
        k: entryKind.cmdStarted,
        id: cmd.id,
        e: cmd.entity,
        eId: cmd.entityId,
        rId: generateUuidV7(),
        connId,
      });
    }, 'JournalWriter.writeCommandStarted'),
    writeCommandOutcome: withTelemetry(async (cmdId, result, connId) => {
      if (Array.isArray(result)) {
        return await writeEntry({
          k: entryKind.cmdCompleted,
          id: cmdId,
          evs: result,
          connId,
        });
      }
      return await writeEntry({
        k: entryKind.cmdFailed,
        id: cmdId,
        res: result,
        connId,
      });
    }, 'JournalWriter.writeCommandCompleted'),
  };
})();
