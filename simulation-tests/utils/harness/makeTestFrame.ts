import { mockSessionAsync } from '@std/testing/mock';
import { SimulationTestConfig } from '../../testConfig.ts';
import { SimulationTest } from '../../SimulationTest.ts';

type TestContext = { denoCtx: Deno.TestContext; simCtx: SimulationTest; onEnd(fn: FrameCleaner): void };
type TestFunc = (ctx: TestContext) => void | Promise<void>;
type DenoTestFunc = (ctx: Deno.TestContext) => Promise<void>;
type FrameFunc = () => unknown | Promise<unknown>;
type FrameCleaner = () => Promise<unknown | void>;
type FrameOpt = {
  beforeEach?: FrameFunc;
  afterEach?: FrameFunc;
  beforeAll?: FrameFunc;
  simCtx: SimulationTest;
};
type TestWrapper = (runTest: TestFunc) => DenoTestFunc;

const makeCleaner = () => {
  const cleanups: FrameCleaner[] = [];
  const onEnd = (cleaner: FrameCleaner) => {
    cleanups.push(cleaner);
  };
  const cleanUp = () => Promise.all(cleanups.map((fn) => fn()));
  return { onEnd, cleanUp };
};

const makeTestFrame = (opt: FrameOpt): TestWrapper => {
  opt?.beforeAll?.();
  return (runTest: TestFunc): DenoTestFunc => async (denoCtx) => {
    const { onEnd, cleanUp } = makeCleaner();
    try {
      await mockSessionAsync(async () => {
        await opt?.beforeEach?.();
        await runTest({ denoCtx, simCtx: opt?.simCtx, onEnd });
      })();
    } finally {
      await cleanUp();
      await opt?.afterEach?.();
    }
  };
};

export const makeSimTest = (opt: SimulationTestConfig) => {
  const simCtx = new SimulationTest(opt);
  return makeTestFrame({ beforeEach: () => simCtx.start(), afterEach: () => simCtx.cleanup(), simCtx });
};
