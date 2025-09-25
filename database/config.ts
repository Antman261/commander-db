import { LifecycleComponent } from '@antman/lifecycle';

type CdbConfig = {
  DEV_MODE?: string;
  DATA_DIRECTORY: string;
  SNAPSHOT_INTERVAL: string;
};

export const configManager = new (class Main extends LifecycleComponent {
  cfg: CdbConfig;
  constructor() {
    super();
    this.cfg = { DATA_DIRECTORY: '/var/cdb/data', SNAPSHOT_INTERVAL: '1000' };
  }
  start() {
    this.cfg = { ...this.cfg, ...Deno.env.toObject() as CdbConfig };
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  checkHealth: undefined;
})();
