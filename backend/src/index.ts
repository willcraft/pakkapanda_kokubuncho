import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { authMiddleware } from './lib/auth';
import { ApiError } from './lib/errors';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chats';
import { checkinRoutes } from './routes/checkins';
import { likeRoutes } from './routes/likes';
import { locationRoutes } from './routes/location';
import { meRoutes } from './routes/me';
import { peopleRoutes } from './routes/people';
import { venueRoutes } from './routes/venues';

export interface Env {
  DB: D1Database;
}

export type AppEnv = { Bindings: Env; Variables: { userId: string } };

const app = new Hono<AppEnv>();

// web版モック(Expo web)の開発用。ネイティブアプリはCORSの対象外。
app.use(
  '*',
  cors({
    origin: (origin) =>
      origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : '',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['content-type', 'authorization'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));
app.route('/', authRoutes);

// 認証が必要なパスにのみミドルウェアを適用する
// (use('*') だと未定義パスまで401になり、共通404が返せない)
const PROTECTED_PATHS = [
  '/me',
  '/location',
  '/venues',
  '/venues/*',
  '/checkins',
  '/checkins/*',
  '/people',
  '/people/*',
  '/matches',
  '/likes',
  '/chats',
  '/chats/*',
];
for (const path of PROTECTED_PATHS) app.use(path, authMiddleware);

app.route('/', meRoutes);
app.route('/', locationRoutes);
app.route('/', venueRoutes);
app.route('/', checkinRoutes);
app.route('/', peopleRoutes);
app.route('/', likeRoutes);
app.route('/', chatRoutes);

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'not found' } }, 404));

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }
  console.error(err);
  return c.json({ error: { code: 'INTERNAL', message: 'internal error' } }, 500);
});

export default app;
