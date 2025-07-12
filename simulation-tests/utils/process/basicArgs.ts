export type Opt = { debug?: boolean; otel?: boolean };

const defaultOpt = (): Required<Opt> => ({ debug: false, otel: false });

export const toDenoArgs = <O extends Opt>(opt: O | undefined) => {
  const { debug, otel } = { ...defaultOpt(), ...opt };
  const args = ['run', '--allow-net'];
  debug && args.push('--inspect');
  otel && args.push('--unstable-otel');
  return args;
};
