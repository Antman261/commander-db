// deno-lint-ignore-file explicit-module-boundary-types
import { TextLineStream } from 'jsr:@std/streams@^1.0.9';
import { delay } from 'jsr:@std/async';
import { badSeed } from '@sim/env/random';
import { makeLogger } from './log.ts';

type Opt = {
  debug?: boolean;
  otel?: boolean;
  seed?: number;
};

export const defaultOpt = (): Required<Opt> => ({
  debug: false,
  otel: false,
  seed: badSeed(),
});

export const verifyOptions = (opt: Opt | undefined): Required<Opt> =>
  Object.assign(defaultOpt(), opt) as Required<Opt>;

let id = 0;

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
  const command = new Deno.Command(Deno.execPath(), { args, stdout: 'piped', stderr: 'piped' });
  let child: Deno.ChildProcess;
  try {
    child = command.spawn();
    const dbLog = makeLogger('database');
    (async () => {
      for await (
        const logLine of child.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) dbLog.error(logLine);
    })();
    (async () => {
      for await (
        const logLine of child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) dbLog(logLine);
    })();
    child.ref();
  } catch (error) {
    console.error('Error while running the file: ', error);
    Deno.exit(4);
  }

  debug ? alert('Ready to connect?') : await delay(100);
  return {
    end: async () => {
      child.kill();
      await delay(10);
      await child.status;
    },
  };
};
