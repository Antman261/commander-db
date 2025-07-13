import { delay } from 'jsr:@std/async';
import { badSeed } from '@sim/env/random';
import { simLog } from '../log.ts';
import { AppInstance, initAppInstance } from './AppInstance.ts';
import { toDenoArgs } from './basicArgs.ts';

export type DatabaseConfig = { debug?: boolean; otel?: boolean; seed?: number };

export const defaultDatabaseConfig = (): Required<DatabaseConfig> => ({
  debug: false,
  otel: false,
  seed: badSeed(),
});

const verifyOptions = (opt: DatabaseConfig | undefined): Required<DatabaseConfig> =>
  Object.assign(defaultDatabaseConfig(), opt) as Required<DatabaseConfig>;

export const startDatabaseInstance = async (opt?: DatabaseConfig): Promise<AppInstance> => {
  const { debug, seed } = verifyOptions(opt);
  const args = toDenoArgs(opt);

  const dir = Deno.cwd();
  const path = dir.endsWith('database') ? dir : `../database`;

  args.push(`${path}/main.ts`, `--sim-seed=${seed}`);
  simLog(`Starting database with cmd: deno ${args.join(' ')}`);

  const appInstance = initAppInstance(args, 'database');

  debug ? alert('Ready to connect?') : await delay(100);
  return appInstance;
};
