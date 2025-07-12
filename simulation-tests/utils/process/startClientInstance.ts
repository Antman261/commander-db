import { badSeed } from '@sim/env/random';
import { toDenoArgs } from './basicArgs.ts';
import { delay } from '@std/async/delay';
import { simLog } from '../log.ts';
import { AppInstance, initAppInstance } from './AppInstance.ts';

export type ClientAppConfig = { debug?: boolean; seed?: number; name: string; appArgs?: string[] };
export const defaultClientConfig = (): Required<ClientAppConfig> => ({
  debug: false,
  seed: badSeed(),
  name: '',
  appArgs: [],
});
export type ClientApp = {
  app: AppInstance;
  sendRequest(path: string, options?: RequestInit): Promise<Response>;
};
export const startClientInstance = async (opt?: ClientAppConfig): Promise<ClientApp> => {
  const { debug, seed, name, appArgs } = { ...defaultClientConfig(), ...opt };
  const denoArgs = toDenoArgs(opt);
  denoArgs.push(`clientApps/${name}/main.ts`);
  appArgs.push(`--sim-seed=${seed}`);
  const args = denoArgs.concat(appArgs);

  simLog(`Starting client(${name}) via: deno ${args.join(' ')}`);

  const app = initAppInstance(args, 'client');
  const host = `http://localhost:${app.port}/`;
  debug ? alert('Ready to connect?') : await delay(100);
  return {
    app,
    sendRequest: (path, options) => fetch(new URL(path, host), options),
  };
};
