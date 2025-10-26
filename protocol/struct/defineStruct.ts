import { commandMessageCodec } from '@proto/msg';
import * as z4 from '@zod/zod/v4/core';
export const defineBinaryRecord = <T extends z4.$ZodCodec>(codec: T) => {
  codec._zod.def._zod.output;
  return (inits: T['_output']) => {
  };
};

const initCommandMessage = defineBinaryRecord(commandMessageCodec);
initCommandMessage({
  maxRuns: '',
  runCooldownMs: '',
  runTimeoutSeconds: '',
  idempotentPeriodHours: '',
  entity: '',
  entityId: '',
  id: '',
  input: '',
  metadata: '',
  name: '',
  parentCommandId: '',
  runAfter: '',
  source: '',
});
