const activePorts = new Set<number>();
const availablePorts = new Set(Array.from({ length: 1000 }, (_, i) => 6200 + i));
export const requestPort = () => {
  const port = availablePorts.values().next().value;
  if (!port) throw new Error('Port pool exhausted');
  activePorts.add(port);
  availablePorts.delete(port);
  return port;
};
export const releasePort = (port: number) => {
  if (activePorts.delete(port)) availablePorts.add(port);
};
