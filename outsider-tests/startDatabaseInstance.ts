// deno-lint-ignore-file explicit-module-boundary-types
import { TextLineStream } from 'jsr:@std/streams@^1.0.9';
import { delay } from 'jsr:@std/async';

type Opt = {
  debug?: boolean;
  otel?: boolean;
};

export const defaultOpt = (): Required<Opt> => ({
  debug: false,
  otel: true,
});

export const verifyOptions = (opt: Opt | undefined): Required<Opt> =>
  Object.assign(defaultOpt(), opt) as Required<Opt>;

export const startDatabaseInstance = async (opt?: Opt) => {
  const { debug, otel } = verifyOptions(opt);
  const args = ['run', '--allow-net'];
  debug && args.push('--inspect');
  otel && args.push('--unstable-otel');

  const dir = Deno.cwd();
  const path = dir.endsWith('database') ? dir : `../database`;

  args.push(`${path}/main.ts`);
  const options = { args, stdout: 'piped', stderr: 'piped' } as const;
  const command = new Deno.Command(Deno.execPath(), options);
  let child: Deno.ChildProcess;
  let stderrPromise;
  let stdoutPromise;
  try {
    child = command.spawn();
    stderrPromise = (async () => {
      for await (
        const logLine of child.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) console.error(logLine);
    })();
    stdoutPromise = (async () => {
      for await (
        const logLine of child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) console.log(logLine);
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
      await Promise.all([stderrPromise, stdoutPromise]);
      await child.status;
    },
  };
};
