import { CommandMessage } from '@fe-db/proto';
import { CommandPending } from '@db/type';

export const toCommandMessage = (cmd: CommandPending): CommandMessage => ({
  ...cmd,
  maxRuns: +cmd.maxRuns,
  runCooldownMs: +cmd.runCooldownMs,
  runTimeoutSeconds: +cmd.runTimeoutSeconds,
  idempotentPeriodHours: +cmd.idempotentPeriodHours,
});
