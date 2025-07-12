import { badSeed } from '@sim/env/random';

type Opt = { debug?: boolean; seed?: number };
const defaultOpt = (): Required<Opt> => ({ debug: false, seed: badSeed() });
export const startClientInstance = async (opt?: Opt) => {
  const { debug, seed } = { ...defaultOpt(), ...opt };
};
