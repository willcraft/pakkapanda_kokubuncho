import { and, eq, inArray, or } from 'drizzle-orm';
import { Hono } from 'hono';

import { compat } from '../../../shared/compatibility';
import { db } from '../db/client';
import { likes, userHobbies, users } from '../db/schema';
import { getActiveUsers, getMyCompatProfile, type ActiveUser } from '../domain/activeUsers';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { sortHobbiesCanonical } from '../lib/hobbies';

export const peopleRoutes = new Hono<AppEnv>();

function serialize(
  me: { mbti: ActiveUser['mbti']; hobbies: ActiveUser['hobbies'] },
  u: ActiveUser,
  liked: boolean,
  likedMe: boolean,
) {
  const { total, rank } = compat(me, u);
  return {
    userId: u.userId,
    mbti: u.mbti,
    ageBand: u.ageBand,
    hobbies: u.hobbies,
    // 店舗滞在中は座標を隠す(店舗単位でのみ位置が分かる)
    lat: u.venueId ? null : u.lat,
    lng: u.venueId ? null : u.lng,
    venueId: u.venueId,
    compat: { total, rank },
    liked,
    likedMe,
  };
}

async function likedSet(d: ReturnType<typeof db>, me: string, targetIds: string[]): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const rows = await d
    .select({ toUser: likes.toUser })
    .from(likes)
    .where(and(eq(likes.fromUser, me), inArray(likes.toUser, targetIds)));
  return new Set(rows.map((r) => r.toUser));
}

async function likedMeSet(d: ReturnType<typeof db>, me: string, targetIds: string[]): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const rows = await d
    .select({ fromUser: likes.fromUser })
    .from(likes)
    .where(and(eq(likes.toUser, me), inArray(likes.fromUser, targetIds)));
  return new Set(rows.map((r) => r.fromUser));
}

peopleRoutes.get('/people/nearby', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const [active, me] = await Promise.all([getActiveUsers(d, Date.now(), userId), getMyCompatProfile(d, userId)]);
  const ids = active.map((u) => u.userId);
  const [liked, likedMe] = await Promise.all([likedSet(d, userId, ids), likedMeSet(d, userId, ids)]);
  return c.json(active.map((u) => serialize(me, u, liked.has(u.userId), likedMe.has(u.userId))));
});

peopleRoutes.get('/matches', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const limit = Math.max(1, Math.min(20, Number(c.req.query('limit') ?? 3) || 3));
  const [active, me] = await Promise.all([getActiveUsers(d, Date.now(), userId), getMyCompatProfile(d, userId)]);
  const top = active
    .map((u) => ({ u, total: compat(me, u).total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((x) => x.u);
  const topIds = top.map((u) => u.userId);
  const [liked, likedMe] = await Promise.all([likedSet(d, userId, topIds), likedMeSet(d, userId, topIds)]);
  return c.json(top.map((u) => serialize(me, u, liked.has(u.userId), likedMe.has(u.userId))));
});

peopleRoutes.get('/people/:userId', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const targetId = c.req.param('userId');
  const [active, me] = await Promise.all([getActiveUsers(d, Date.now(), userId), getMyCompatProfile(d, userId)]);
  const [liked, likedMe] = await Promise.all([likedSet(d, userId, [targetId]), likedMeSet(d, userId, [targetId])]);

  const activeTarget = active.find((u) => u.userId === targetId);
  if (activeTarget)
    return c.json(serialize(me, activeTarget, liked.has(targetId), likedMe.has(targetId)));

  // 非アクティブでもチャット解禁済み(どちらか片方向のいいねあり)なら取得できる
  const unlocked = await d
    .select({ fromUser: likes.fromUser })
    .from(likes)
    .where(
      or(
        and(eq(likes.fromUser, userId), eq(likes.toUser, targetId)),
        and(eq(likes.fromUser, targetId), eq(likes.toUser, userId)),
      ),
    );
  if (unlocked.length === 0) throw new ApiError('NOT_FOUND', '相手が見つかりません');

  const user = (await d.select().from(users).where(eq(users.id, targetId)))[0];
  if (!user) throw new ApiError('NOT_FOUND', '相手が見つかりません');
  const hobbies = sortHobbiesCanonical(
    (await d.select({ hobby: userHobbies.hobby }).from(userHobbies).where(eq(userHobbies.userId, targetId))).map(
      (r) => r.hobby,
    ),
  );
  const offline: ActiveUser = {
    userId: targetId,
    mbti: user.mbti as ActiveUser['mbti'],
    ageBand: user.ageBand,
    hobbies,
    lat: 0,
    lng: 0,
    venueId: null,
    checkedInAt: null,
  };
  const body = serialize(me, offline, liked.has(targetId), likedMe.has(targetId));
  return c.json({ ...body, lat: null, lng: null });
});
