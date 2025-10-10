import { withTelemetry } from '@db/telemetry';

type OpenFile = typeof Deno.open;
type ReadTextFile = typeof Deno.readTextFile;
type WriteTextFile = typeof Deno.writeTextFile;

export const openFile: OpenFile = withTelemetry((...args: Parameters<OpenFile>): ReturnType<OpenFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.open(...args);
}, 'openFile');
export const readTextFile: ReadTextFile = withTelemetry(
  (...args: Parameters<ReadTextFile>): ReturnType<ReadTextFile> => {
    // todo: Randomly inject failures here (during tests)
    return Deno.readTextFile(...args);
  },
  'readTextFile',
);
export const readJsonFile = withTelemetry(async <T>(
  ...args: Parameters<ReadTextFile>
): Promise<T | undefined> => {
  // todo: Randomly inject failures here (during tests)
  const text = await Deno.readTextFile(...args);
  return text === '' ? undefined : JSON.parse(text);
}, 'readJsonFile');
export const tryReadJsonFile = withTelemetry(async <T>(
  ...args: Parameters<ReadTextFile>
): Promise<T | undefined | Error> => {
  // todo: Randomly inject failures here (during tests)
  try {
    return await readJsonFile(...args);
  } catch (error) {
    if (error instanceof Error) return error;
  }
}, 'tryReadJsonFile');
export const tryMakeDir = withTelemetry(async (path: string): Promise<void> => {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    return;
  }
}, 'tryMakeDir');
export const writeJsonFile = withTelemetry((
  path: string | URL,
  data: unknown,
  options?: Parameters<WriteTextFile>[2],
): Promise<void> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.writeTextFile(path, JSON.stringify(data), options);
}, 'writeJsonFile');
export const writeJsonFileClean = withTelemetry(async (
  path: string | URL,
  data: unknown,
): Promise<void> => {
  // todo: Randomly inject failures here (during tests)
  using file = await Deno.open(path, { write: true, create: true });
  await file.write(new TextEncoder().encode(JSON.stringify(data)));
  await file.sync();
}, 'writeJsonFileClean');
export const writeTextFile: WriteTextFile = withTelemetry((
  ...args: Parameters<WriteTextFile>
): ReturnType<WriteTextFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.writeTextFile(...args);
}, 'writeTextFile');

export const removeFile = withTelemetry(async (path: string | URL): Promise<void> => {
  await Deno.remove(path);
}, 'removeFile');

export const tryOpenFile = withTelemetry(async (
  ...args: Parameters<OpenFile>
): Promise<ReturnType<OpenFile> | Error> => {
  // todo: Randomly inject failures here (during tests)
  try {
    return await Deno.open(...args);
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    throw error;
  }
}, 'tryOpenFile');
