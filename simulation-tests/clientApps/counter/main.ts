import { parseArgs } from '@std/cli';
import { logger } from '@hono/hono/logger';
import { Hono } from '@hono/hono';

const args = parseArgs(Deno.args);
const port = args.port ?? 8092;
const app = new Hono();

app.use(logger());
app.get('/', (c) => c.text('Hello Hono!'));

Deno.serve({ port }, app.fetch);
