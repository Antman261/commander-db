import { parseArgs } from '@std/cli';
import { logger } from '@hono/hono/logger';
import { Hono } from '@hono/hono';
import { initClient } from '@fe-db/client';

const args = parseArgs(Deno.args, { string: ['port'], collect: ['dbPort'] });
const port = Number(args.port ?? 8092);
const app = new Hono();
const feDb = initClient({ port: Number(args.dbPort[0]) }); // todo: make client handle this
feDb.startCommandSubscription(async (cmd) => {
  console.log('Received command:', cmd);
  return [];
});
const eventSubscription = await feDb.startEventSubscription(0);
(async () => {
  for await (const event of eventSubscription.eventStream) {
    console.log('Received event:', event);
  }
  console.log('Event stream subscription ended');
})();

app.use(logger());
app.notFound((c) => {
  c.status(404);
  return c.json({ error: 'Not found' });
});
app.get('/', (c) => c.text('Hello Hono!'));
app.post('/counters', async (c) => {
  await feDb.issueCommand(await c.req.json());
  return c.json({ outcome: 'command issued' });
});

Deno.serve({ port }, app.fetch);
