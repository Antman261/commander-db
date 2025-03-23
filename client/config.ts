export type ConnectionConfig = {
  hostname?: string;
  port?: number;
  // todo: authentication here?
};
const defaultConfig = (): Required<ConnectionConfig> => ({
  hostname: '127.0.0.1',
  port: 8092,
});
export const verifyConfig = (opt: ConnectionConfig | undefined): Required<ConnectionConfig> => {
  const config = Object.assign(defaultConfig(), opt) as Required<ConnectionConfig>;
  if (config.port <= 1000) {
    throw new Error('InvalidConnectionConfig: Port must be > 1000');
  }
  return config;
};
