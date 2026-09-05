import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';

import { HOBBIES } from '../../../shared/types';
import { db } from '../db/client';
import { checkins, userHobbies, users } from '../db/schema';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { jsonBody, parse, profileSchema } from '../lib/validate';

export const meRoutes = new Hono<AppEnv>();

meRoutes.get('/me', async (c) => {
  const userId = c.get('userId');
  const d = db(c.env);

  const user = (await d.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) throw new ApiError('NOT_FOUND', 'ユーザーが見つかりません');

  const hobbies = (
    await d.select({ hobby: userHobbies.hobby }).from(userHobbies).where(eq(userHobbies.userId, userId))
  )
    .map((r) => r.hobby)
    .sort((a, b) => HOBBIES.indexOf(a as (typeof HOBBIES)[number]) - HOBBIES.indexOf(b as (typeof HOBBIES)[number]));

  const active = (
    await d
      .select({ venueId: checkins.venueId, checkedInAt: checkins.checkedInAt })
      .from(checkins)
      .where(and(eq(checkins.userId, userId), isNull(checkins.checkedOutAt)))
  )[0];

  return c.json({
    userId,
    ageBand: user.ageBand,
    hobbies,
    mbti: user.mbti,
    checkin: active ?? null,
  });
});

meRoutes.put('/me', async (c) => {
  const userId = c.get('userId');
  const body = parse(profileSchema, await jsonBody(c.req));
  const d = db(c.env);

  await d.update(users).set({ ageBand: body.ageBand, mbti: body.mbti }).where(eq(users.id, userId));
  await d.delete(userHobbies).where(eq(userHobbies.userId, userId));
  await d.insert(userHobbies).values(body.hobbies.map((hobby) => ({ userId, hobby })));

  return c.json({ ok: true });
});
