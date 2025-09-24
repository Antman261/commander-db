type OpenFile = typeof Deno.open;

export const openFile: OpenFile = (...args: Parameters<OpenFile>): ReturnType<OpenFile> => {
  // todo: Randomly inject failures here (during tests)
  return Deno.open(...args);
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
