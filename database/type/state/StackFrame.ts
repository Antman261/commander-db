import { Obj } from '@antman/formic-utils';
import { Bigint128 } from '../primitive/Bigint128.ts';

/**
 * the index position of a stack frame in the parent frame's call stack
 */
export type FrameIndex = number;
/**
 * The identity of a stack frame expressed as a list of frame indexes, where the rightmost value is the FrameIndex of the current stack in the parent, the next rightmost value is the FrameIndex of the parent within its parent, etc. Ultimately providing a path through the tree to the current frame.
 */
export type FrameTuple = FrameIndex[];
// type ExpandedFrameTuple = [StackId, FnName, ...FrameTuple];
export type StackFrameStored = {
  stackId: Bigint128;
  frameTuple: FrameTuple;
  result: Obj;
};
