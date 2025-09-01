import { Component } from '@db/lifecycle';

type CdbConfig = {
  DEV_MODE?: string;
  DATA_DIRECTORY: string;
};

export const main = new (class Main implements Component {
  name: 'main';
  status: 'pending' | 'running' | 'crashed';
  cfg: CdbConfig;
  constructor() {
    this.name = 'main';
    this.cfg = { DATA_DIRECTORY: '/var/cdb/data' };
    this.status = 'pending';
  }
  async start() {
    this.cfg = Deno.env.toObject() as CdbConfig;
    this.cfg.DEV_MODE = 'true'; // todo: remove this line!
    if (this.cfg.DEV_MODE === 'true') {
      this.cfg.DATA_DIRECTORY = await Deno.makeTempDir({ prefix: 'commander_db' });
    }
    this.status = 'running';
  }
  async close() {
    if (this.cfg.DEV_MODE) await Deno.remove(this.cfg.DATA_DIRECTORY, { recursive: true });
  }
  getStatus() {
    return Promise.resolve(this.status);
  }
})();
