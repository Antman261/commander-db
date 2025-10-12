import { AsyncLocalStorage } from 'node:async_hooks';
import { Span, trace } from 'npm:@opentelemetry/api@1';
import { Func } from '@antman/formic-utils';

const tracer = trace.getTracer('commander-db');

// type ContextSetter<Fn extends AsyncFunc> = (...args: Parameters<Fn>) => Context;

const telemetrySpanStorage = new AsyncLocalStorage<Span>();

export const getActiveSpan = (): Span | undefined => telemetrySpanStorage.getStore();

export const withTelemetry = <Fn extends Func>(fn: Fn, name: string): Fn =>
// @ts-expect-error HKT issue -- ts won't fix
(...args) =>
  tracer.startActiveSpan(
    name,
    (span) =>
      telemetrySpanStorage.run(span, async () => {
        span.setAttribute('args', args);
        try {
          return await fn(...args);
        } catch (error) {
          if (error instanceof Error) {
            span.setAttribute('errored', `${error.message}\n${error.stack}`);
          }
          throw error;
        } finally {
          span.end();
        }
      }),
  );
