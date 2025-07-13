import { defaultConfig, SimulationTestConfig } from './testConfig.ts';
import { AppInstance, ClientApp, startClientApp, startDatabaseInstance } from './utils/process/index.ts';

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
    const dbPort = this.databaseInstances[0]?.port;
    this.clientInstances = await Promise.all(
      this.#config.clients.map((cfg) => {
        const config = structuredClone(cfg);
        (config.appArgs ??= []).push(`--dbPort=${dbPort}`);
        return startClientApp(config);
      }),
    );
  }
  async cleanup() {
    await Promise.all(
      this.databaseInstances.map((db) => db.end()).concat(
        this.clientInstances.map((client) => client.app.end()),
      ),
    );
  }
}
