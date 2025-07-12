export type ClientAppConfig = {
  kind: 'ClientApp';
} & ConfigBase;
export type DatabaseConfig = { kind: 'DatabaseLeader' } & ConfigBase;

type LogRule = RegExp | null;
type LogConfig = { failOn: LogRule; emitOn: LogRule };
type ConfigBase = { behaviour: string; logs: LogConfig; debug?: boolean; otel?: boolean };

export type SimulationTestConfig = {
  databases: DatabaseConfig[];
  clients: ClientAppConfig[];
  keepTestServerOpen: boolean;
};
const defaultLogConfig = (): LogConfig => ({
  failOn: /Unhandled rejection|Uncaught exception|Cannot find module/,
  emitOn: null,
});
export const defaultDatabaseConfig = (): DatabaseConfig => ({
  kind: 'DatabaseLeader',
  behaviour: 'Standard',
  logs: defaultLogConfig(),
});
export const defaultClientConfig = (): ClientAppConfig => ({
  kind: 'ClientApp',
  behaviour: 'Standard',
  logs: defaultLogConfig(),
});
export const defaultConfig = (): SimulationTestConfig => ({
  databases: [defaultDatabaseConfig()],
  clients: [defaultClientConfig()],
  keepTestServerOpen: false,
});
