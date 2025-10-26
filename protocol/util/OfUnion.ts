import type { OfUnion } from '@antman/formic-utils';

export type OfK<U, K> = OfUnion<U, 'k', K>;
