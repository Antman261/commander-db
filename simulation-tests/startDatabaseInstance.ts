// deno-lint-ignore-file explicit-module-boundary-types
import { delay } from 'jsr:@std/async';
import { badSeed } from '@sim/env/random';
import { makeLogger } from './log.ts';
import { initAppInstance } from './AppInstance.ts';

type Opt = { debug?: boolean; otel?: boolean; seed?: number };

export const defaultOpt = (): Required<Opt> => ({ debug: false, otel: false, seed: badSeed() });

export const verifyOptions = (opt: Opt | undefined): Required<Opt> =>
  Object.assign(defaultOpt(), opt) as Required<Opt>;

export const startDatabaseInstance = async (opt?: Opt) => {
  const log = makeLogger('simulation');
  const { debug, otel, seed } = verifyOptions(opt);
  const args = ['run', '--allow-net'];
  debug && args.push('--inspect');
  otel && args.push('--unstable-otel');

  const dir = Deno.cwd();
  const path = dir.endsWith('database') ? dir : `../database`;

  args.push(`${path}/main.ts`, `--sim-seed=${seed}`);
  log(`Starting database with cmd: deno ${args.join(' ')}`);

  const command = toPipedCommand(Deno.execPath(), args);
  const appInstance = initAppInstance(command, 'database');

  debug ? alert('Ready to connect?') : await delay(100);
  return appInstance;
};

const toPipedCommand = (path: string, args: string[]) =>
  new Deno.Command(path, { args, stdout: 'piped', stderr: 'piped' });
