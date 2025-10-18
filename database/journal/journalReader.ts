import { ensureFile } from '@std/fs';
import { configManager } from '@db/cfg';
import { BinaryDecodeStream } from '@fe-db/proto';
import { readJsonFile, tryOpenFile, writeJsonFileClean } from '@db/disk';
import { JournalEntry } from '@db/jnl';
import { commandState } from '@db/state';
import { withTelemetry } from '@db/telemetry';
import { LifecycleNode, newNode } from '@antman/lifecycle';
import type { JournalConsumer } from './journalConsumer.ts';

type Snapshot = Record<'pageNo' | 'seekPos', number>;
const streamDecoder = BinaryDecodeStream<JournalEntry>();
type JournalReader = LifecycleNode & {
  checkSnapshotInterval(pageNo: number): Promise<void>;
  processEntry(entry: JournalEntry): void;
};
export const journalReader = newNode<JournalReader, JournalConsumer<unknown>>((internals) => {
  let dirPath: string;
  let snapPath: string;
  const loadSnapshot = withTelemetry(async (): Promise<void> => {
    await ensureFile(snapPath);
    let { pageNo } = await readJsonFile<Snapshot>(snapPath) ?? { pageNo: 0 };
    await Promise.all(internals.getChildren().map(loadSnapshotAt(pageNo)));
    while (await readPage(pageNo)) {
      pageNo++;
    }
  }, 'JournalReader.loadSnapshot');
  const saveSnapshot = withTelemetry(async (pageNo: number): Promise<void> => {
    await Promise.all(internals.getChildren().map(takeSnapshot(pageNo)));
    // snapshots need to all fail or all complete -- solve this problem by providing a page number with pageNo snapshot callback, so that all downstream components can restore from the previous snapshot if the journal reader fails to save its snapshot
    await writeJsonFileClean(snapPath, JSON.stringify({ pageNo }));
  }, 'JournalReader.saveSnapshot');
  const readPage = withTelemetry(async (pageNo: number): Promise<boolean> => {
    const path = `${dirPath}/data/${pageNo}`;
    const currentPage = await tryOpenFile(path, { read: true });
    if (currentPage instanceof Error) return false;
    console.log({ pageNo });
    const pageStream = currentPage.readable.pipeThrough(streamDecoder);

    const consumers = internals.getChildren();
    for await (const [entry] of pageStream) {
      consumers.map(readEntry(entry));
    }
    pageStream.cancel();
    return true;
  }, 'JournalReader.readPage');
  return {
    name: 'JournalReader',
    start: withTelemetry(async () => {
      dirPath = `${configManager.get('DATA_DIRECTORY')}/jnl`;
      snapPath = `${dirPath}/reader.snap`;
      internals.registerChildNode(commandState);
      await loadSnapshot();
      await internals.startChildNodes();
    }, 'JournalReader.start'),
    close: () => Promise.resolve(),
    checkSnapshotInterval: withTelemetry(async (pageNo: number) => {
      const snapshotInterval = Number(configManager.get('SNAPSHOT_INTERVAL'));
      if ((pageNo + 1) % snapshotInterval === 0) await saveSnapshot(pageNo);
    }, 'JournalReader.checkSnapshotInterval'),
    processEntry: withTelemetry((entry: JournalEntry) => {
      internals.getChildren().map(readEntry(entry));
    }, 'JournalReader.processEntry'),
  };
});

const takeSnapshot = (pageNo: number) => (component: JournalConsumer<unknown>) =>
  component.saveSnapshot(pageNo);
const loadSnapshotAt = (pageNo: number) => (component: JournalConsumer<unknown>) =>
  component.loadSnapshot(pageNo);
const readEntry = (entry: JournalEntry) => (component: JournalConsumer<unknown>) =>
  component.processEntry(entry);
