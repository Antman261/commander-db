import { deadline } from '@std/async/deadline';

export const withDeadline = <Fn extends (...args: never[]) => Promise<unknown>>(fn: Fn, ms: number): Fn =>
  ((...args) => deadline(fn(...args), ms)) as Fn;
