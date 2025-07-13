import { badSeed } from '@sim/env/random';
import { toDenoArgs } from './basicArgs.ts';
import { delay } from '@std/async/delay';
import { simLog } from '../log.ts';
import { AppInstance, initAppInstance } from './AppInstance.ts';

export type ClientAppConfig = { debug?: boolean; seed?: number; name: string; appArgs?: string[] };
type Obj = Record<string, unknown>;
type TextResponse = { text: string; status: number };
type JsonResponse<T extends Obj = Obj> = { json?: T; status: number };
export const defaultClientConfig = (): Required<ClientAppConfig> => ({
  debug: false,
  seed: badSeed(),
  name: '',
  appArgs: [],
});
export type ClientApp = {
  app: AppInstance;
  sendRequest(path: string, options?: RequestInit): Promise<Response>;
  getText(path: string, options?: RequestInit): Promise<TextResponse>;
  get(path: string, options?: RequestInit): Promise<JsonResponse>;
  post<T extends Obj = Obj>(path: string, data: Obj, options?: RequestInit): Promise<JsonResponse<T>>;
};
export const startClientApp = async (opt?: ClientAppConfig): Promise<ClientApp> => {
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
    async getText(path, options) {
      const res = await fetch(new URL(path, host), options);
      const text = await res.text();
      return { status: res.status, text };
    },
    async get(path, options) {
      const res = await fetch(new URL(path, host), options);
      const json = await res.json();
      return { status: res.status, json };
    },
    async post(path, data, options) {
      const res = await fetch(new URL(path, host), {
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      });
      const ct = res.headers.get('content-type');

      const json = ct?.includes('json') ? await res.json() : undefined;
      return { status: res.status, json };
    },
  };
};
