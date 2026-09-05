import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { authed, register } from './helpers';

async function checkIn(token: string, venueId: string): Promise<Response> {
  return authed(token, '/checkins', { method: 'POST', body: JSON.stringify({ venueId }) });
}

async function myCheckin(token: string): Promise<{ venueId: string } | null> {
  const res = await authed(token, '/me');
  const body = (await res.json()) as { checkin: { venueId: string } | null };
  return body.checkin;
}

describe('POST /checkins', () => {
  it('チェックインできる', async () => {
    const { token } = await register();
    const res = await checkIn(token, 'v-cielo');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { checkinId: string; venueId: string; checkedInAt: number };
    expect(body.venueId).toBe('v-cielo');
    expect((await myCheckin(token))?.venueId).toBe('v-cielo');
  });

  it('2店舗目で1店舗目が自動チェックアウトされる', async () => {
    const { userId, token } = await register();
    await checkIn(token, 'v-cielo');
    await checkIn(token, 'v-noir');
    expect((await myCheckin(token))?.venueId).toBe('v-noir');
    const rows = await env.DB.prepare(
      'SELECT venue_id, checked_out_at FROM checkins WHERE user_id = ? ORDER BY checked_in_at',
    )
      .bind(userId)
      .all();
    expect(rows.results).toHaveLength(2);
    expect(rows.results[0].checked_out_at).not.toBeNull();
    expect(rows.results[1].checked_out_at).toBeNull();
  });

  it('存在しない店舗は 404', async () => {
    const { token } = await register();
    const res = await checkIn(token, 'v-nope');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /checkins/current', () => {
  it('解除できる。滞在中がなければ 404', async () => {
    const { token } = await register();
    await checkIn(token, 'v-cielo');
    const del = await authed(token, '/checkins/current', { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect(await myCheckin(token)).toBeNull();
    const again = await authed(token, '/checkins/current', { method: 'DELETE' });
    expect(again.status).toBe(404);
  });
});
