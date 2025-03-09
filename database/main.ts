import { startNetworkLayer } from '@db/net';
async function startServer() {
  await startNetworkLayer();
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await startServer();
} else {
  await startServer();
}
