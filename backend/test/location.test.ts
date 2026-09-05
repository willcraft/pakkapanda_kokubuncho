import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { AREA, distanceM, isActive } from '../src/domain/area';
import { authed, IN_AREA, OUT_OF_AREA, register, sendLocation } from './helpers';

describe('domain/area', () => {
  it('中心から中心は距離0', () => {
    expect(distanceM(AREA.center, AREA.center)).toBe(0);
  });

  it('緯度0.001度differenceは約111m', () => {
    const d = distanceM(AREA.center, { lat: AREA.center.lat + 0.001, lng: AREA.center.lng });
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });

  it('isActive: 10分以内+エリア内 → true', () => {
    const now = Date.now();
    expect(isActive({ ...IN_AREA, updatedAt: now - 5 * 60_000 }, now)).toBe(true);
  });

  it('isActive: 10分超は false', () => {
    const now = Date.now();
    expect(isActive({ ...IN_AREA, updatedAt: now - 11 * 60_000 }, now)).toBe(false);
  });

  it('isActive: エリア外座標は false', () => {
    const now = Date.now();
    expect(isActive({ ...OUT_OF_AREA, updatedAt: now }, now)).toBe(false);
  });
});

describe('POST /location', () => {
  it('エリア内座標は inArea: true', async () => {
    const { token } = await register();
    const res = await sendLocation(token, IN_AREA);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inArea: true });
  });

  it('エリア外座標は inArea: false', async () => {
    const { token } = await register();
    const res = await sendLocation(token, OUT_OF_AREA);
    expect(await res.json()).toEqual({ inArea: false });
  });

  it('2回送るとupsertされる(1行のみ)', async () => {
    const { userId, token } = await register();
    await sendLocation(token, IN_AREA);
    await sendLocation(token, OUT_OF_AREA);
    const rows = await env.DB.prepare('SELECT lat, lng FROM user_locations WHERE user_id = ?')
      .bind(userId)
      .all();
    expect(rows.results).toHaveLength(1);
    expect(rows.results[0].lat).toBeCloseTo(OUT_OF_AREA.lat);
  });

  it('座標なしは 400', async () => {
    const { token } = await register();
    const res = await authed(token, '/location', { method: 'POST', body: JSON.stringify({}) });
    expect(res.status).toBe(400);
  });
});
