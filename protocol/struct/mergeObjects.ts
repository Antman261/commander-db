import type { Obj } from '@antman/formic-utils';

export const mergeObjects = <A extends {}, B, C = unknown>(
  a: A,
  b: B,
  c?: C,
): A & B & C => Object.assign(a, b, c);

export const makeCallableObject = <F extends Function, O extends Obj>(f: F, o: O): F & O =>
  Object.assign(f, o);
