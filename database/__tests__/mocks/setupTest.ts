// deno-lint-ignore-file explicit-module-boundary-types
import { delay } from 'jsr:@std/async';
import { startClient } from './client.ts';

export const setupTest = async () => {
  const dir = Deno.cwd();
  const p = dir.endsWith('database') ? dir : `${dir}/database`;
  const command = new Deno.Command(`${Deno.execPath()}`, {
    args: ['run', '--allow-net', `${p}/main.ts`],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  let child: Deno.ChildProcess;
  try {
    child = command.spawn();
    child.ref();
  } catch (error) {
    console.error('Error while running the file: ', error);
    Deno.exit(4);
  }
  await delay(100);
  return {
    client: await startClient(),
    end: async () => {
      child.kill();
      await child.status;
    },
  };
};
