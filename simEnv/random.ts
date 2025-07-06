import prand from 'pure-rand';

export const badSeed = (): number => Date.now() ^ (Math.random() * 0x100000000);

let seed = badSeed();
let nextRng = prand.xoroshiro128plus(seed);

export const __resetWithSeed = (newSeed: number): void => {
  seed = newSeed;
  nextRng = prand.xoroshiro128plus(seed);
};
export const randomNumber = (): number => {
  let result: number;
  [result, nextRng] = prand.uniformIntDistribution(-1, 1, nextRng);
  return result;
};
