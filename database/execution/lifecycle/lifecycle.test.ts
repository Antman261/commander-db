import { delay } from 'jsr:@std/async';
import { expect } from 'jsr:@std/expect';
import { Component, ComponentStatus, Lifecycle } from './lifecycle.ts';

const createChecks = () => {
  const checks = {
    didStart: false,
    didRun: false,
    didClosing: false,
    didClose: false,
  };
  const passCheck = (check: keyof typeof checks) => () => checks[check] = true;
  return { checks, passCheck };
};

const makeComponent = (c?: Partial<Component>): Component => {
  let status: ComponentStatus = 'pending';
  return {
    name: 'test-component',
    start: async () => await delay(1) ?? (status = 'running'),
    getStatus: async () => await delay(0) ?? status,
    close: () => delay(1),
    ...c,
  };
};

const makeCrashingComponent = (c?: Partial<Component>, crashAt = 3): Component => {
  let status: ComponentStatus = 'pending';
  let ms = 0;
  return makeComponent({
    start: async () => await delay(1) ?? (status = 'running'),
    getStatus: async () => {
      if (ms === crashAt) status = 'crashed';
      await delay(ms);
      ms++;
      return status;
    },
    ...c,
  });
};

Deno.test('LifeCycle', async ({ step }) => {
  await step('can start & close a lifecycle', async () => {
    const { checks, passCheck } = createChecks();
    const lc = new Lifecycle();
    lc.on('starting', passCheck('didStart'));
    lc.on('running', passCheck('didRun'));
    lc.on('closing', passCheck('didClosing'));
    lc.on('closed', passCheck('didClose'));
    await lc.start();
    await lc.close();
    expect(checks).toEqual({
      didStart: true,
      didRun: true,
      didClosing: true,
      didClose: true,
    });
  });
  await step('start and close lifecycle components', async () => {
    const events: string[] = [];
    const lc = new Lifecycle();
    lc.register(makeComponent({ name: 'test-component-1' }));
    lc.register(makeComponent({ name: 'test-component-2' }));
    lc.register(makeComponent({ name: 'test-component-3' }));
    lc.on('componentStarted', (name) => events.push(`componentStarted ${name}`));
    lc.on('componentClosing', (name) => events.push(`componentClosing ${name}`));
    lc.on('componentClosed', (name) => events.push(`componentClosed  ${name}`));
    await lc.start();
    await lc.close();
    await delay(2);
    expect(events).toEqual([
      'componentStarted test-component-1',
      'componentStarted test-component-2',
      'componentStarted test-component-3',
      'componentClosing test-component-3',
      'componentClosed  test-component-3',
      'componentClosing test-component-2',
      'componentClosed  test-component-2',
      'componentClosing test-component-1',
      'componentClosed  test-component-1',
    ]);
  });
  await step('restarts crashed life cycle component', async () => {
    const events: string[] = [];
    const lc = new Lifecycle({ healthCheckIntervalMs: 1 });
    lc.register(makeComponent({ name: 'test-component-1' }));
    lc.register(makeComponent({ name: 'test-component-2' }));
    lc.register(makeCrashingComponent({ name: 'test-component-3' }, 2));
    lc.register(makeComponent({ name: 'test-component-4' }));
    lc.register(makeCrashingComponent({ name: 'test-component-5' }, 4));
    lc.on('componentStarted', (name) => events.push(`componentStarted ${name}`));
    lc.on('componentClosing', (name) => events.push(`componentClosing ${name}`));
    lc.on('componentClosed', (name) => events.push(`componentClosed  ${name}`));
    lc.on('componentRestarting', (name) => events.push(`componentRestarting  ${name}`));
    lc.on('componentRestarted', (name) => events.push(`componentRestarted  ${name}`));
    await lc.start();
    await delay(15);
    await lc.close();
    await delay(30);
    expect(events).toEqual([
      'componentStarted test-component-1',
      'componentStarted test-component-2',
      'componentStarted test-component-3',
      'componentStarted test-component-4',
      'componentStarted test-component-5',
      'componentRestarting  test-component-3',
      'componentRestarted  test-component-3',
      'componentRestarting  test-component-5',
      'componentRestarted  test-component-5',
      'componentClosing test-component-5',
      'componentClosed  test-component-5',
      'componentClosing test-component-4',
      'componentClosed  test-component-4',
      'componentClosing test-component-3',
      'componentClosed  test-component-3',
      'componentClosing test-component-2',
      'componentClosed  test-component-2',
      'componentClosing test-component-1',
      'componentClosed  test-component-1',
    ]);
  });
});
