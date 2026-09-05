import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { authed, register, sendLocation } from './helpers';

interface VenueSummary {
  id: string;
  distanceM: number | null;
  memberCount: number;
  mbtiCharacter: string | null;
  compatPct: number | null;
}

async function getVenues(token: string): Promise<VenueSummary[]> {
  const res = await authed(token, '/venues');
  return (await res.json()) as VenueSummary[];
}

async function checkIn(token: string, venueId: string): Promise<void> {
  await authed(token, '/checkins', { method: 'POST', body: JSON.stringify({ venueId }) });
}

/** アクティブなENFP(映画/旅行/グルメ)を作って v-cielo にチェックインさせる */
async function setupEnfpAtCielo() {
  const enfp = await register({ mbti: 'ENFP', hobbies: ['映画', '旅行', 'グルメ'] });
  await sendLocation(enfp.token);
  await checkIn(enfp.token, 'v-cielo');
  return enfp;
}

describe('GET /venues', () => {
  it('5店舗が返り、位置未送信なら distanceM は null', async () => {
    const me = await register();
    const venues = await getVenues(me.token);
    expect(venues).toHaveLength(5);
    expect(venues[0].distanceM).toBeNull();
  });

  it('位置送信済みなら distanceM が数値で返る', async () => {
    const me = await register();
    await sendLocation(me.token);
    const venues = await getVenues(me.token);
    const cielo = venues.find((v) => v.id === 'v-cielo')!;
    expect(typeof cielo.distanceM).toBe('number');
    expect(cielo.distanceM).toBeLessThan(250);
  });

  it('滞在中のアクティブメンバーが集計される(INFJ×ENFP 共通趣味2 → 100%)', async () => {
    await setupEnfpAtCielo();
    const me = await register(); // INFJ [映画, 旅行]
    const cielo = (await getVenues(me.token)).find((v) => v.id === 'v-cielo')!;
    expect(cielo.memberCount).toBe(1);
    expect(cielo.mbtiCharacter).toBe('ENFP');
    expect(cielo.compatPct).toBe(100);
  });

  it('位置心拍が10分超のユーザーは集計から消える', async () => {
    const enfp = await setupEnfpAtCielo();
    await env.DB.prepare('UPDATE user_locations SET updated_at = ? WHERE user_id = ?')
      .bind(Date.now() - 11 * 60_000, enfp.userId)
      .run();
    const me = await register();
    const cielo = (await getVenues(me.token)).find((v) => v.id === 'v-cielo')!;
    expect(cielo.memberCount).toBe(0);
    expect(cielo.mbtiCharacter).toBeNull();
    expect(cielo.compatPct).toBeNull();
  });

  it('MBTIキャラ同数はタイプ名昇順で先勝ち', async () => {
    await setupEnfpAtCielo();
    const intj = await register({ mbti: 'INTJ', hobbies: ['読書'] });
    await sendLocation(intj.token);
    await checkIn(intj.token, 'v-cielo');
    const me = await register();
    const cielo = (await getVenues(me.token)).find((v) => v.id === 'v-cielo')!;
    expect(cielo.memberCount).toBe(2);
    expect(cielo.mbtiCharacter).toBe('ENFP');
  });
});

describe('GET /venues/:id', () => {
  it('members がチェックイン古い順で compat 付きで返る', async () => {
    const enfp = await setupEnfpAtCielo();
    const intj = await register({ mbti: 'INTJ', hobbies: ['読書'] });
    await sendLocation(intj.token);
    await checkIn(intj.token, 'v-cielo');
    // ENFPを先(古い)に固定
    await env.DB.prepare('UPDATE checkins SET checked_in_at = ? WHERE user_id = ?')
      .bind(Date.now() - 30 * 60_000, enfp.userId)
      .run();

    const me = await register(); // INFJ
    const res = await authed(me.token, '/venues/v-cielo');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      members: { userId: string; mbti: string; compat: { total: number; rank: string } }[];
    };
    expect(body.members.map((m) => m.mbti)).toEqual(['ENFP', 'INTJ']);
    expect(body.members[0].compat).toEqual({ total: 100, rank: 'S' });
    expect(body.members[1].compat.rank).toBe('A'); // INFJ×INTJ base 78
  });

  it('存在しない店舗は 404', async () => {
    const me = await register();
    const res = await authed(me.token, '/venues/v-nope');
    expect(res.status).toBe(404);
  });
});
