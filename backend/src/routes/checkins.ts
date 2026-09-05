import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../db/client';
import { checkins, venues } from '../db/schema';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { jsonBody, parse } from '../lib/validate';

const checkinSchema = z.object({ venueId: z.string().min(1) });

export const checkinRoutes = new Hono<AppEnv>();

checkinRoutes.post('/checkins', async (c) => {
  const userId = c.get('userId');
  const body = parse(checkinSchema, await jsonBody(c.req));
  const d = db(c.env);

  const venue = (await d.select({ id: venues.id }).from(venues).where(eq(venues.id, body.venueId)))[0];
  if (!venue) throw new ApiError('NOT_FOUND', '店舗が見つかりません');

  const now = Date.now();
  // 滞在中チェックインは自動でチェックアウト(同時に1店舗のみ)
  await d
    .update(checkins)
    .set({ checkedOutAt: now })
    .where(and(eq(checkins.userId, userId), isNull(checkins.checkedOutAt)));

  const checkinId = crypto.randomUUID();
  await d.insert(checkins).values({ id: checkinId, userId, venueId: body.venueId, checkedInAt: now });

  return c.json({ checkinId, venueId: body.venueId, checkedInAt: now });
});

checkinRoutes.delete('/checkins/current', async (c) => {
  const userId = c.get('userId');
  const updated = await db(c.env)
    .update(checkins)
    .set({ checkedOutAt: Date.now() })
    .where(and(eq(checkins.userId, userId), isNull(checkins.checkedOutAt)))
    .returning({ id: checkins.id });
  if (updated.length === 0) throw new ApiError('NOT_FOUND', '滞在中のチェックインがありません');
  return c.json({ ok: true });
});
