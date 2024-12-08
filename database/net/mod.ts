import { openSocketServer } from "./socket.ts";
export async function startNetworkLayer() {
  await openSocketServer();
}
