// deno-lint-ignore-file explicit-module-boundary-types
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
  const options = { args, stdout: 'inherit', stderr: 'inherit' } as const;
  const command = new Deno.Command(Deno.execPath(), options);
  let child: Deno.ChildProcess;
  try {
    child = command.spawn();
    child.ref();
  } catch (error) {
    console.error('Error while running the file: ', error);
    Deno.exit(4);
  }

  debug ? alert('Ready to connect?') : await delay(100);
  return {
    end: async () => {
      child.kill();
      await child.status;
    },
  };
};
