import { Hono } from 'hono';

import { ApiError } from './lib/errors';

export interface Env {
  DB: D1Database;
}

export type AppEnv = { Bindings: Env; Variables: { userId: string } };

const app = new Hono<AppEnv>();

app.get('/health', (c) => c.json({ ok: true }));

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'not found' } }, 404));

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }
  console.error(err);
  return c.json({ error: { code: 'INTERNAL', message: 'internal error' } }, 500);
});

export default app;
