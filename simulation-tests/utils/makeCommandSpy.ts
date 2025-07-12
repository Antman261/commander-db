export const makeCommandSpy = () => {
  const { promise, resolve } = Promise.withResolvers();
  const handler = (cmd: any): Promise<any[]> => resolve(cmd) ?? Promise.resolve([]);
  return { promise, handler };
};
