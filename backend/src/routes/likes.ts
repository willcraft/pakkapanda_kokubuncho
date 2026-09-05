import { eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { ulid } from 'ulidx';
import { z } from 'zod';

import { compat } from '../../../shared/compatibility';
import { db } from '../db/client';
import { likes, messages, userHobbies, users } from '../db/schema';
import { getMyCompatProfile } from '../domain/activeUsers';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { sortHobbiesCanonical } from '../lib/hobbies';
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

  const inserted = await d
    .insert(likes)
    .values({ fromUser: userId, toUser: body.toUserId, createdAt: Date.now() })
    .onConflictDoNothing()
    .returning({ fromUser: likes.fromUser });

  // 新規いいねのときだけ、相手への通知としていいねメッセージを会話に投入する
  if (inserted.length > 0) {
    await d.insert(messages).values({
      id: ulid(),
      fromUser: userId,
      toUser: body.toUserId,
      text: 'いいね',
      kind: 'like',
      createdAt: Date.now(),
    });
  }

  return c.json({ ok: true });
});

/** 自分にいいねをくれて、まだ返していない相手の一覧(マッチタブの「いいねを返す」用) */
likeRoutes.get('/likes/received', async (c) => {
  const userId = c.get('userId');
  const d = db(c.env);

  const received = await d.select({ fromUser: likes.fromUser }).from(likes).where(eq(likes.toUser, userId));
  const sent = await d.select({ toUser: likes.toUser }).from(likes).where(eq(likes.fromUser, userId));
  const sentSet = new Set(sent.map((r) => r.toUser));
  const pendingIds = received.map((r) => r.fromUser).filter((id) => !sentSet.has(id));
  if (pendingIds.length === 0) return c.json([]);

  const me = await getMyCompatProfile(d, userId);
  const rows = await d.select().from(users).where(inArray(users.id, pendingIds));
  const hobbyRows = await d
    .select({ userId: userHobbies.userId, hobby: userHobbies.hobby })
    .from(userHobbies)
    .where(inArray(userHobbies.userId, pendingIds));
  const hobbiesByUser = new Map<string, string[]>();
  for (const r of hobbyRows) {
    hobbiesByUser.set(r.userId, [...(hobbiesByUser.get(r.userId) ?? []), r.hobby]);
  }

  return c.json(
    rows.map((u) => {
      const hobbies = sortHobbiesCanonical(hobbiesByUser.get(u.id) ?? []);
      const { total, rank } = compat(me, { mbti: u.mbti as never, hobbies });
      return {
        userId: u.id,
        mbti: u.mbti,
        ageBand: u.ageBand,
        hobbies,
        compat: { total, rank },
      };
    }),
  );
});
