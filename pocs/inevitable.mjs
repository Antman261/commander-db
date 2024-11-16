import { AsyncLocalStorage } from "node:async_hooks";

const identityCtx = new AsyncLocalStorage();
const getIdentityCtx = () => identityCtx.getStore();
const getRandId = () => Math.floor(Math.random() * 65_536).toString(16);
const initAsStackOwner = () => {
  const id = getRandId();
  return {
    id: null,
    stack: [],
    callChain: [],
    stackId: id, // deterministic in Inevitable
  };
};
const createIdentityCtx = (funcName, opts) => {
  const idCtx = getIdentityCtx();
  const isStackOwner = !idCtx;
  const {
    stack,
    stackId,
    callChain,
  } = isStackOwner ? initAsStackOwner() : idCtx.registerFrame();
  let lastChildCreatedAt = Date.now();
  const frameIdxGenerator = createFrameTupleGenerator();

  function *createFrameTupleGenerator() {
    let frameIdx = 0;
    while (true) {
      yield frameIdx;
      frameIdx += 1;
    }
  }
  const genNewFrameTuple = () => frameIdxGenerator.next().value;
  const end = () => {
    if (isStackOwner && opts.debug) {
      console.log(stackId, 'ended:', stack);
    }
  };

  return {
    registerFrame: () => {
      const frameIdx = genNewFrameTuple();
      const newChildCallChain = [...callChain, frameIdx];
      stack.push(newChildCallChain);
      lastChildCreatedAt = Date.now();
      return {
        id: frameIdx,
        callChain: newChildCallChain, // new array is required
        stackId,
        stack,
      }
    },
    getFrameTuple: () => [funcName, stackId, ...callChain],
    hasResolved() {
      whenConditionPasses(() => Date.now() - lastChildCreatedAt > 2000).then(end);
    }
  }
}

function whenConditionPasses(checkCondition, checkMs = 1000, timeoutMs = 0) {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  let timeout = undefined;
  const interval = setInterval(async () => {
    if (await checkCondition()) {
      clearInterval(interval);
      clearTimeout(timeout)
      resolve();
    }
  }, checkMs);
  if (timeoutMs > 0) {
    if (timeoutMs <= checkMs) {
      throw new Error('timeoutMs must be greater than checkMs');
    }
    timeout = setTimeout(() => {
      reject(new Error('Condition timed out'));
    });
  }
  return promise;
}

function withIdentity(func, opt) {
  const funcName = opt?.funcName ?? (func.name || func.constructor.name);
  if (!funcName) throw new Error(`Function name not set`);
  if (funcName === 'AsyncFunction') throw new Error(`Function name not set: Either de-anonymise function or provide { funcName } via options`);
  const o = {
    async [funcName] (...args) {
      const ctx = createIdentityCtx(funcName, { debug: opt.debug });
      const result = identityCtx.run(ctx, func, ...args);
      ctx.hasResolved();
      return result;
    }
  }

  return o[funcName];
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isL1Parent = (i) => i % 3 === 0;
const isL2Parent = (i) => [16, 23].includes(i);
const run = withIdentity (async () => {
  console.log(getIdentityCtx().getFrameTuple())
  const frames = [];
  const fn = withIdentity(async (i) => {
    const ctx = getIdentityCtx();
    frames.push({ i, frameTuple: ctx.getFrameTuple() });
    await wait(300 * Math.random());
    isL1Parent(i) && Promise.all([10 + i, 20 + i].map(fn));
    isL2Parent(i) && Promise.all([100 + i, 200 + i].map(fn));
  }, { funcName: 'fn' });

  [1, 2, 3, 4, 5, 6].map(fn);
  await wait(1000);
  return frames;
}, { funcName: 'run' });

(async () => {
  const stacks = await Promise.all([run(), run(), run(), run()]);

  const allPassed = stacks[0].every((frame) => {
    const equivalentFrames = stacks.map((stack) => stack.find(f => f.i === frame.i));
    console.log(equivalentFrames);
    const passed = framesShareCallchainIdentity(equivalentFrames);
    console.assert(passed);
    return passed;
  });
  allPassed && console.log('WOOOOHOOOO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
})();


function framesShareCallchainIdentity(frames) {
  const frameIdFromTuple = (frame) => {
    const { frameTuple: [funcName, , ...chain] } = frame;
    return [funcName, ...chain].join(',');
  };
  const frameId = frameIdFromTuple(frames[0]);
  return frames.every((frame) => frameIdFromTuple(frame) === frameId);
}