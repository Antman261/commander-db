import { AppInstance, startClientInstance, startDatabaseInstance } from './utils/process';

type AppKind =
  | 'CommandClient'
  | 'EventClient'
  | 'DatabaseLeader'
  | 'DatabaseFollower';
type AppConfig = {
  kind: AppKind;
  behaviour: string;
  logsFail: RegExp | null;
  logsEmit: RegExp | null;
  debug?: boolean;
  otel?: boolean;
};

export type SimulationTestConfig = {
  databases: AppConfig[];
  clients: AppConfig[];
  keepTestServerOpen: boolean;
};

const defaultDatabaseConfig: AppConfig = {
  kind: 'DatabaseLeader',
  behaviour: 'Standard',
  logsFail: /Unhandled rejection|Uncaught exception|Cannot find module/,
  logsEmit: null,
};
const defaultClientConfig: AppConfig = {
  kind: 'CommandClient',
  behaviour: 'Standard',
  logsFail: /Unhandled rejection|Uncaught exception|Cannot find module/,
  logsEmit: null,
};
const defaultConfig: SimulationTestConfig = {
  databases: [defaultDatabaseConfig],
  clients: [defaultClientConfig],
  keepTestServerOpen: false,
};

export class SimulationTest {
  clientInstances: AppInstance[] = [];
  databaseInstances: AppInstance[] = [];
  constructor(config = defaultConfig) {
    (async () => {
      this.databaseInstances = await Promise.all(
        config.databases.map(startDatabaseInstance),
      );
      this.clientInstances = await Promise.all(
        config.databases.map(startClientInstance),
      );
    })();
  }
}
