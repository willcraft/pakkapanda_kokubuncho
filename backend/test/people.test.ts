import { describe, expect, it } from 'vitest';

import { authed, register, sendLocation } from './helpers';

interface NearbyPerson {
  userId: string;
  mbti: string;
  lat: number | null;
  lng: number | null;
  venueId: string | null;
  compat: { total: number; rank: string };
  liked?: boolean;
}

async function nearby(token: string): Promise<NearbyPerson[]> {
  const res = await authed(token, '/people/nearby');
  return (await res.json()) as NearbyPerson[];
}

describe('GET /people/nearby', () => {
  it('アクティブな他人だけが返る(自分・位置未送信者は出ない)', async () => {
    const walker = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await sendLocation(walker.token);
    await register({ mbti: 'ISTJ', hobbies: ['読書'] }); // 位置未送信 = 非アクティブ

    const me = await register();
    await sendLocation(me.token);
    const list = await nearby(me.token);
    expect(list.map((p) => p.userId)).toEqual([walker.userId]);
  });

  it('街歩き中は座標が返り、店舗滞在中は venueId のみで座標は null', async () => {
    const walker = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await sendLocation(walker.token);
    const dweller = await register({ mbti: 'INTJ', hobbies: ['読書'] });
    await sendLocation(dweller.token);
    await authed(dweller.token, '/checkins', {
      method: 'POST',
      body: JSON.stringify({ venueId: 'v-cielo' }),
    });

    const me = await register();
    const list = await nearby(me.token);
    const w = list.find((p) => p.userId === walker.userId)!;
    const d = list.find((p) => p.userId === dweller.userId)!;
    expect(w.venueId).toBeNull();
    expect(typeof w.lat).toBe('number');
    expect(d.venueId).toBe('v-cielo');
    expect(d.lat).toBeNull();
    expect(d.lng).toBeNull();
  });
});

describe('GET /matches', () => {
  it('総合スコア降順で limit 件返り、liked フラグを含む', async () => {
    // me: INFJ [映画, 旅行]
    const enfp = await register({ mbti: 'ENFP', hobbies: ['映画', '旅行'] }); // total 100
    await sendLocation(enfp.token);
    const istj = await register({ mbti: 'ISTJ', hobbies: ['読書'] }); // base 38
    await sendLocation(istj.token);
    const intj = await register({ mbti: 'INTJ', hobbies: ['映画'] }); // base 78 + 3
    await sendLocation(intj.token);

    const me = await register();
    const res = await authed(me.token, '/matches?limit=2');
    const list = (await res.json()) as NearbyPerson[];
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.userId)).toEqual([enfp.userId, intj.userId]);
    expect(list[0].compat).toEqual({ total: 100, rank: 'S' });
    expect(list[0].liked).toBe(false);
  });
});

describe('GET /people/:userId', () => {
  it('アクティブな相手のプロフィールが compat 付きで返る', async () => {
    const enfp = await register({ mbti: 'ENFP', hobbies: ['映画', '旅行', 'グルメ'] });
    await sendLocation(enfp.token);
    const me = await register();
    const res = await authed(me.token, `/people/${enfp.userId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as NearbyPerson & { ageBand: string; hobbies: string[] };
    expect(body.mbti).toBe('ENFP');
    expect(body.hobbies).toEqual(['映画', '旅行', 'グルメ']);
    expect(body.compat.rank).toBe('S');
  });

  it('相手が自分にいいね済みなら likedMe が true', async () => {
    const enfp = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await sendLocation(enfp.token);
    const me = await register();
    await sendLocation(me.token);
    await authed(enfp.token, '/likes', {
      method: 'POST',
      body: JSON.stringify({ toUserId: me.userId }),
    });
    const body = (await (await authed(me.token, `/people/${enfp.userId}`)).json()) as {
      liked: boolean;
      likedMe: boolean;
    };
    expect(body.liked).toBe(false);
    expect(body.likedMe).toBe(true);
  });

  it('非アクティブな相手(チャット未解禁)は 404', async () => {
    const ghost = await register({ mbti: 'ENFP', hobbies: ['映画'] }); // 位置未送信
    const me = await register();
    const res = await authed(me.token, `/people/${ghost.userId}`);
    expect(res.status).toBe(404);
  });
});
