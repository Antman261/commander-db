import { blue, brightBlue, cyan } from '@std/fmt/colors';
import { Kind } from './Kind.ts';

const clrs = { simulation: blue, database: cyan, client: brightBlue } as const satisfies Record<
  Kind,
  typeof blue
>;

export const makeLogger = (kind: Kind, id?: string | number) => {
  const hasId = id !== undefined;
  const prefix = clrs[kind](`${kind}${hasId ? `-${id}` : ''}:`);
  return Object.assign((...args: any[]) => console.log(prefix, ...args), {
    error: (...args: any[]) => console.error(prefix, ...args),
  });
};
