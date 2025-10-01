type OpenFile = typeof Deno.open;
type ReadTextFile = typeof Deno.readTextFile;
type WriteTextFile = typeof Deno.writeTextFile;

export const openFile: OpenFile = (...args: Parameters<OpenFile>): ReturnType<OpenFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.open(...args);
};
export const readTextFile: ReadTextFile = (...args: Parameters<ReadTextFile>): ReturnType<ReadTextFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.readTextFile(...args);
};
export const readJsonFile = async <T>(
  ...args: Parameters<ReadTextFile>
): Promise<T | undefined> => {
  // todo: Randomly inject failures here (during tests)
  const text = await Deno.readTextFile(...args);
  return text === '' ? undefined : JSON.parse(text);
};
export const writeJsonFile = (
  path: string | URL,
  data: unknown,
  options?: Parameters<WriteTextFile>[2],
): Promise<void> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.writeTextFile(path, JSON.stringify(data), options);
};
export const writeJsonFileClean = async (
  path: string | URL,
  data: unknown,
): Promise<void> => {
  // todo: Randomly inject failures here (during tests)
  using file = await Deno.open(path, { write: true, create: true });
  await file.write(new TextEncoder().encode(JSON.stringify(data)));
  await file.sync();
};
export const writeTextFile: WriteTextFile = (
  ...args: Parameters<WriteTextFile>
): ReturnType<WriteTextFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.writeTextFile(...args);
};

export const removeFile = async (path: string | URL): Promise<void> => {
  await Deno.remove(path);
};

export const tryOpenFile = async (
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
};
