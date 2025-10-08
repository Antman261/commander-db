import { LifecycleComponent } from '@antman/lifecycle';

type CdbConfig = {
  DEV_MODE?: string;
  DATA_DIRECTORY: string;
  SNAPSHOT_INTERVAL: string;
};

class ConfigManager extends LifecycleComponent {
  readonly cfg: CdbConfig = { DATA_DIRECTORY: `${Deno.env.get('HOME')}/data/cdb`, SNAPSHOT_INTERVAL: `1000` }; //
  start(): Promise<void> {
    const { DATA_DIRECTORY, SNAPSHOT_INTERVAL, DEV_MODE } = Deno.env.toObject() as CdbConfig;
    this.cfg.DATA_DIRECTORY = DATA_DIRECTORY ?? this.cfg.DATA_DIRECTORY;
    this.cfg.SNAPSHOT_INTERVAL = SNAPSHOT_INTERVAL ?? this.cfg.SNAPSHOT_INTERVAL;
    this.cfg.DEV_MODE = DEV_MODE ?? this.cfg.DEV_MODE;
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

export const configManager = new ConfigManager();
