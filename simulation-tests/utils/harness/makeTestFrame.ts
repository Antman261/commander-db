import { mockSessionAsync } from '@std/testing/mock';
import { SimulationTestConfig } from '../../testConfig.ts';
import { SimulationTest } from '../../SimulationTest.ts';
import { simLog } from '../log.ts';

type TestContext = { denoCtx: Deno.TestContext; simCtx: SimulationTest };
type TestFunc = (ctx: TestContext) => void | Promise<void>;
type DenoTestFunc = (ctx: Deno.TestContext) => void | Promise<void>;
type FrameFunc = () => unknown | Promise<unknown>;
type FrameOpt = {
  beforeEach?: FrameFunc;
  afterEach?: FrameFunc;
  beforeAll?: FrameFunc;
  simCtx: SimulationTest;
};
type TestWrapper = (runTest: TestFunc) => DenoTestFunc;
const makeTestFrame = (opt: FrameOpt): TestWrapper => {
  opt?.beforeAll?.();
  return (runTest: TestFunc): DenoTestFunc => async (denoCtx) => {
    try {
      await mockSessionAsync(async () => {
        await opt?.beforeEach?.();
        await runTest({ denoCtx, simCtx: opt?.simCtx });
      })();
    } finally {
      await opt?.afterEach?.();
    }
  };
};

export const makeSimTest = (opt: SimulationTestConfig) => {
  const simCtx = new SimulationTest(opt);
  simLog({ opt });
  return makeTestFrame({ beforeEach: () => simCtx.start(), afterEach: () => simCtx.cleanup(), simCtx });
};
