import { openSocketServer } from './socket.ts';
export async function startNetworkLayer(): Promise<void> {
  await openSocketServer();
}
