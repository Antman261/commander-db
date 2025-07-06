import { blue, brightBlue, cyan } from '@std/fmt/colors';

type Kind = 'simulation' | 'database' | 'client';
const clrs = { simulation: blue, database: cyan, client: brightBlue } as const satisfies Record<
  Kind,
  typeof blue
>;

export const makeLogger = (kind: Kind, id?: string) => {
  const prefix = clrs[kind](`${kind}${id ? `<${id}>` : ''}:`);
  return Object.assign((...args: any[]) => console.log(prefix, ...args), {
    error: (...args: any[]) => console.error(prefix, ...args),
  });
};
