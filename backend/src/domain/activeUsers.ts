import { and, eq, gte, inArray, isNull } from 'drizzle-orm';

import type { Hobby, MbtiType } from '../../../shared/types';
import { HOBBIES } from '../../../shared/types';
import type { Db } from '../db/client';
import { checkins, userHobbies, userLocations, users } from '../db/schema';
import { ACTIVE_WINDOW_MS, inArea } from './area';

export interface ActiveUser {
  userId: string;
  mbti: MbtiType;
  ageBand: string;
  hobbies: Hobby[];
  lat: number;
  lng: number;
  venueId: string | null;
  checkedInAt: number | null;
}

function sortHobbies(hobbies: Hobby[]): Hobby[] {
  return [...hobbies].sort((a, b) => HOBBIES.indexOf(a) - HOBBIES.indexOf(b));
}

/** エリア内かつ位置心拍が10分以内のユーザー(滞在中チェックイン付き)を返す */
export async function getActiveUsers(d: Db, now: number, excludeUserId?: string): Promise<ActiveUser[]> {
  const rows = await d
    .select({
      userId: users.id,
      mbti: users.mbti,
      ageBand: users.ageBand,
      lat: userLocations.lat,
      lng: userLocations.lng,
    })
    .from(users)
    .innerJoin(userLocations, eq(userLocations.userId, users.id))
    .where(gte(userLocations.updatedAt, now - ACTIVE_WINDOW_MS));

  const inAreaRows = rows.filter(
    (r) => r.userId !== excludeUserId && inArea({ lat: r.lat, lng: r.lng }),
  );
  if (inAreaRows.length === 0) return [];

  const ids = inAreaRows.map((r) => r.userId);

  const hobbyRows = await d
    .select({ userId: userHobbies.userId, hobby: userHobbies.hobby })
    .from(userHobbies)
    .where(inArray(userHobbies.userId, ids));
  const hobbiesByUser = new Map<string, Hobby[]>();
  for (const row of hobbyRows) {
    const list = hobbiesByUser.get(row.userId) ?? [];
    list.push(row.hobby as Hobby);
    hobbiesByUser.set(row.userId, list);
  }

  const checkinRows = await d
    .select({ userId: checkins.userId, venueId: checkins.venueId, checkedInAt: checkins.checkedInAt })
    .from(checkins)
    .where(and(inArray(checkins.userId, ids), isNull(checkins.checkedOutAt)));
  const checkinByUser = new Map(checkinRows.map((r) => [r.userId, r]));

  return inAreaRows.map((r) => {
    const checkin = checkinByUser.get(r.userId);
    return {
      userId: r.userId,
      mbti: r.mbti as MbtiType,
      ageBand: r.ageBand,
      hobbies: sortHobbies(hobbiesByUser.get(r.userId) ?? []),
      lat: r.lat,
      lng: r.lng,
      venueId: checkin?.venueId ?? null,
      checkedInAt: checkin?.checkedInAt ?? null,
    };
  });
}

/** 自分のプロフィール(相性計算用)を取得する */
export async function getMyCompatProfile(
  d: Db,
  userId: string,
): Promise<{ mbti: MbtiType; hobbies: Hobby[] }> {
  const user = (await d.select({ mbti: users.mbti }).from(users).where(eq(users.id, userId)))[0];
  const hobbyRows = await d
    .select({ hobby: userHobbies.hobby })
    .from(userHobbies)
    .where(eq(userHobbies.userId, userId));
  return {
    mbti: user.mbti as MbtiType,
    hobbies: sortHobbies(hobbyRows.map((r) => r.hobby as Hobby)),
  };
}
