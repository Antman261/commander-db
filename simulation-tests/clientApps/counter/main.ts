import { parseArgs } from '@std/cli';
import { logger } from '@hono/hono/logger';
import { Hono } from '@hono/hono';
import { initClient } from '@fe-db/client';

const args = parseArgs(Deno.args, { string: ['port'], collect: ['dbPort'] });
const port = Number(args.port ?? 8092);
const app = new Hono();
const counters: Record<string, number> = {};
const feDb = initClient({ port: Number(args.dbPort[0]) }); // todo: make client handle this
feDb.startCommandSubscription(async (cmd) => {
  console.log('Received command:', cmd);
  if (cmd.command === 'start-counter') return [];
  return [];
});
const eventSubscription = await feDb.startEventSubscription(0);
(async () => {
  for await (const event of eventSubscription.eventStream) {
    console.log('Received event:', event);
    // @ts-expect-error .
    if (event.type === 'counter-started') counters[event.aggregateId] ??= 0;
  }
  console.log('Event stream subscription ended');
})();

app.use(logger());
app.notFound((c) => {
  c.status(404);
  return c.json({ error: 'Not found' });
});
app.get('/', (c) => c.text('Hello Hono!'));
app.get('/counters', (c) => c.json(counters));
app.post('/counters', async (c) => {
  const { name } = await c.req.json();
  await feDb.issueCommand({
    aggregate: 'counter',
    aggregateId: name,
    command: 'start-counter',
  });
  return c.json({ outcome: 'command issued' });
});

Deno.serve({ port }, app.fetch);
