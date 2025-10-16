import { CommandInputMessage, UInt16, UInt8 } from '@fe-db/proto';
import { cmdKind, cmdStatus, CommandPending } from '@db/type';
import { generateUuidV7 } from '@db/utl';

export const toCommandPending = (command: CommandInputMessage): CommandPending => ({
  id: command.id ?? generateUuidV7(),
  kind: cmdKind.standard,
  status: cmdStatus.pending,
  // metadata: {}, // todo inject open telemetry context
  runs: [],
  createdAt: Date.now(),
  ...command,
  maxRuns: new UInt8(command.maxRuns ?? 3),
  runCooldownMs: new UInt8(command.maxRuns ?? 2000),
  runTimeoutSeconds: new UInt8(command.runCooldownMs ?? 5),
  idempotentPeriodHours: new UInt16(command.runTimeoutSeconds ?? 96),
  runAfter: command.runAfter ?? Date.now(),
});
