import { AsyncLocalStorage } from 'node:async_hooks';
import { Span, trace } from 'npm:@opentelemetry/api@1';
import { AsyncFunc } from '@antman/formic-utils';

const tracer = trace.getTracer('commander-db');

// type ContextSetter<Fn extends AsyncFunc> = (...args: Parameters<Fn>) => Context;

const telemetrySpanStorage = new AsyncLocalStorage<Span>();

export const getActiveSpan = (): Span | undefined => telemetrySpanStorage.getStore();

export const withTelemetry = <Fn extends AsyncFunc>(fn: Fn, name: string): Fn =>
// @ts-expect-error HKT issue -- ts won't fix
(...args: Parameters<Fn>): Promise<ReturnType<Fn>> =>
  tracer.startActiveSpan(
    name,
    (span) =>
      telemetrySpanStorage.run(span, async () => {
        span.setAttribute('args', args);
        try {
          const returned = (await fn(...args)) as ReturnType<Fn>;
          span.setAttribute('returned', returned);
          return returned;
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

export function Observed<This, Args extends never[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): void {
  context.addInitializer(function () {
    // @ts-expect-error HKT issue -- ts won't fix
    this[context.name] = withTelemetry(target.bind(this), `${this.constructor.name}.${String(context.name)}`);
  });
}
