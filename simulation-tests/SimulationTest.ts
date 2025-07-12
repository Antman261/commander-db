import { defaultConfig, SimulationTestConfig } from './testConfig.ts';
import { AppInstance, ClientApp, startClientInstance, startDatabaseInstance } from './utils/process/index.ts';

export class SimulationTest {
  clientInstances: ClientApp[] = [];
  databaseInstances: AppInstance[] = [];
  #config: SimulationTestConfig;
  constructor(config = defaultConfig()) {
    this.#config = config;
  }
  async start() {
    this.databaseInstances = await Promise.all(
      this.#config.databases.map(startDatabaseInstance),
    );
    this.clientInstances = await Promise.all(
      this.#config.clients.map(startClientInstance),
    );
  }
}
