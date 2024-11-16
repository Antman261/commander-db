export type ValueOf<T> = T[keyof T];
export type EntriesOf<T> = { keys: string[]; values: ValueOf<T>[] };
