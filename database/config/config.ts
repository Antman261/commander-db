import { LifecycleNode } from '@antman/lifecycle';

type CdbConfig = {
  DEV_MODE?: string;
  DATA_DIRECTORY: string;
  SNAPSHOT_INTERVAL: string;
};
type ConfigManager = LifecycleNode & {
  name: 'ConfigManager';
  get: (prop: string) => string | undefined;
};
export const configManager: ConfigManager = (() => {
  const cfg: CdbConfig = { DATA_DIRECTORY: `${Deno.env.get('HOME')}/data/cdb`, SNAPSHOT_INTERVAL: `1000` }; //
  return {
    name: 'ConfigManager',
    start(): Promise<void> {
      const { DATA_DIRECTORY, SNAPSHOT_INTERVAL, DEV_MODE } = Deno.env.toObject() as CdbConfig;
      cfg.DATA_DIRECTORY = DATA_DIRECTORY ?? cfg.DATA_DIRECTORY;
      cfg.SNAPSHOT_INTERVAL = SNAPSHOT_INTERVAL ?? cfg.SNAPSHOT_INTERVAL;
      cfg.DEV_MODE = DEV_MODE ?? cfg.DEV_MODE;
      return Promise.resolve();
    },
    close: () => Promise.resolve(),
    get: (prop: string) => cfg[prop as keyof CdbConfig],
  };
})();
