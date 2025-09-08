import { LifecycleComponent } from '@antman/lifecycle';

type CdbConfig = {
  DEV_MODE?: string;
  DATA_DIRECTORY: string;
};

export const main = new (class Main extends LifecycleComponent {
  cfg: CdbConfig;
  constructor() {
    super();
    this.cfg = { DATA_DIRECTORY: '/var/cdb/data' };
  }
  async start() {
    this.cfg = Deno.env.toObject() as CdbConfig;
    this.cfg.DEV_MODE = 'true'; // todo: remove this line!
    if (this.cfg.DEV_MODE === 'true') {
      this.cfg.DATA_DIRECTORY = await Deno.makeTempDir({ prefix: 'commander_db' });
    }
  }
  close() {
    return Promise.resolve();
  }
  checkHealth: undefined;
})();
