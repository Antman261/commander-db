import { ClientAppConfig, defaultClientConfig } from './utils/process/startClientInstance.ts';
import { DatabaseConfig, defaultDatabaseConfig } from './utils/process/startDatabaseInstance.ts';

export type SimulationTestConfig = {
  databases: DatabaseConfig[];
  clients: ClientAppConfig[];
  keepTestServerOpen?: boolean;
};
export const defaultConfig = (): SimulationTestConfig => ({
  databases: [defaultDatabaseConfig()],
  clients: [defaultClientConfig()],
  keepTestServerOpen: false,
});
