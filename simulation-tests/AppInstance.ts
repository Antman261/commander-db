import { TextLineStream } from 'jsr:@std/streams@^1.0.9/text-line-stream';
import { Kind } from './Kind.ts';
import { makeLogger } from './log.ts';
import { delay } from '@std/async/delay';

export type AppInstance = {
  status: 'starting' | 'running' | 'exited';
  process: Deno.ChildProcess;
  end(): Promise<void>;
};

export const initAppInstance = (command: Deno.Command, kind: Kind): AppInstance => {
  try {
    const process = command.spawn();
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
      async end() {
        process.kill();
        await delay(10);
        await process.status;
        status = 'exited';
      },
    };
  } catch (error) {
    console.error('Error while running the file: ', error);
    Deno.exit(4);
  }
};
