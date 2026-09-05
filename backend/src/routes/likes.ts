import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../db/client';
import { likes, users } from '../db/schema';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { jsonBody, parse } from '../lib/validate';

const likeSchema = z.object({ toUserId: z.string().min(1) });

export const likeRoutes = new Hono<AppEnv>();

likeRoutes.post('/likes', async (c) => {
  const userId = c.get('userId');
  const body = parse(likeSchema, await jsonBody(c.req));
  if (body.toUserId === userId) throw new ApiError('BAD_REQUEST', '自分にはいいねできません');

  const d = db(c.env);
  const target = (await d.select({ id: users.id }).from(users).where(eq(users.id, body.toUserId)))[0];
  if (!target) throw new ApiError('NOT_FOUND', '相手が見つかりません');

  await d
    .insert(likes)
    .values({ fromUser: userId, toUser: body.toUserId, createdAt: Date.now() })
    .onConflictDoNothing();

  return c.json({ ok: true });
});
