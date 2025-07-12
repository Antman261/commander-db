import { TextLineStream } from 'jsr:@std/streams@^1.0.9/text-line-stream';
import { Kind } from './Kind.ts';
import { makeLogger } from '../log.ts';
import { delay } from '@std/async/delay';
import { releasePort, requestPort } from './portManager.ts';

export type AppInstance = {
  port: number;
  readonly status: 'starting' | 'running' | 'exited';
  process: Deno.ChildProcess;
  end(): Promise<void>;
};

export const initAppInstance = (args: string[], kind: Kind): AppInstance => {
  try {
    const port = requestPort();
    args.push(`--port=${port}`);
    const process = toPipedDeno(args).spawn();
    const dbLog = makeLogger(kind, process.pid);
    (async () => {
      for await (
        const logLine of process.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) dbLog.error(logLine);
    })();
    (async () => {
      for await (
        const logLine of process.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())
      ) dbLog(logLine);
    })();
    process.ref();
    let status: AppInstance['status'] = 'running';
    return {
      process,
      status,
      port,
      async end() {
        process.kill();

        await delay(10);
        await process.status;
        releasePort(port);
        status = 'exited';
      },
    };
  } catch (error) {
    console.error('Error while running the file: ', error);
    Deno.exit(4);
  }
};

const toPipedDeno = (args: string[]) =>
  new Deno.Command(Deno.execPath(), { args, stdout: 'piped', stderr: 'piped' });
