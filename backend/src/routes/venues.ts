import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { compat } from '../../../shared/compatibility';
import { venueCompatPct, venueMbtiCharacter } from '../../../shared/venueStats';
import { db } from '../db/client';
import { userLocations, venues } from '../db/schema';
import { getActiveUsers, getMyCompatProfile, type ActiveUser } from '../domain/activeUsers';
import { distanceM } from '../domain/area';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';

export const venueRoutes = new Hono<AppEnv>();

function membersOf(active: ActiveUser[], venueId: string): ActiveUser[] {
  return active
    .filter((u) => u.venueId === venueId)
    .sort((a, b) => (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0));
}

async function myLocation(d: ReturnType<typeof db>, userId: string) {
  const rows = await d
    .select({ lat: userLocations.lat, lng: userLocations.lng })
    .from(userLocations)
    .where(eq(userLocations.userId, userId));
  return rows[0] ?? null;
}

venueRoutes.get('/venues', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const [allVenues, active, me, loc] = await Promise.all([
    d.select().from(venues),
    getActiveUsers(d, Date.now(), userId),
    getMyCompatProfile(d, userId),
    myLocation(d, userId),
  ]);

  return c.json(
    allVenues.map((v) => {
      const members = membersOf(active, v.id);
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        lat: v.lat,
        lng: v.lng,
        distanceM: loc ? Math.round(distanceM(loc, { lat: v.lat, lng: v.lng })) : null,
        memberCount: members.length,
        mbtiCharacter: venueMbtiCharacter(members),
        compatPct: venueCompatPct(me, members),
      };
    }),
  );
});

venueRoutes.get('/venues/:id', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const venue = (await d.select().from(venues).where(eq(venues.id, c.req.param('id'))))[0];
  if (!venue) throw new ApiError('NOT_FOUND', '店舗が見つかりません');

  const [active, me, loc] = await Promise.all([
    getActiveUsers(d, Date.now(), userId),
    getMyCompatProfile(d, userId),
    myLocation(d, userId),
  ]);
  const members = membersOf(active, venue.id);

  return c.json({
    id: venue.id,
    name: venue.name,
    category: venue.category,
    lat: venue.lat,
    lng: venue.lng,
    distanceM: loc ? Math.round(distanceM(loc, { lat: venue.lat, lng: venue.lng })) : null,
    memberCount: members.length,
    mbtiCharacter: venueMbtiCharacter(members),
    compatPct: venueCompatPct(me, members),
    members: members.map((m) => {
      const { total, rank } = compat(me, m);
      return {
        userId: m.userId,
        mbti: m.mbti,
        ageBand: m.ageBand,
        hobbies: m.hobbies,
        checkedInAt: m.checkedInAt,
        compat: { total, rank },
      };
    }),
  });
});
