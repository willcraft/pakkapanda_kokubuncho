import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { authed, register, VALID_REGISTER } from './helpers';

async function rawRegister(body: unknown): Promise<Response> {
  return SELF.fetch('https://api.test/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /auth/register', () => {
  it('登録すると userId と token が返る', async () => {
    const { userId, token } = await register();
    expect(userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it('ageConfirmed が true でないと 400', async () => {
    const res = await rawRegister({ ...VALID_REGISTER, ageConfirmed: false });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('不正なMBTIは 400', async () => {
    const res = await rawRegister({ ...VALID_REGISTER, mbti: 'ABCD' });
    expect(res.status).toBe(400);
  });

  it('趣味が空だと 400', async () => {
    const res = await rawRegister({ ...VALID_REGISTER, hobbies: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /me', () => {
  it('Bearer なしは 401', async () => {
    const res = await SELF.fetch('https://api.test/me');
    expect(res.status).toBe(401);
  });

  it('不正トークンは 401', async () => {
    const res = await authed('bogus-token', '/me');
    expect(res.status).toBe(401);
  });

  it('登録したプロフィールが返る(チェックインなし)', async () => {
    const { userId, token } = await register();
    const res = await authed(token, '/me');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      userId,
      ageBand: '30代',
      hobbies: ['映画', '旅行'],
      mbti: 'INFJ',
      checkin: null,
    });
  });
});

describe('PUT /me', () => {
  it('プロフィールを更新できる', async () => {
    const { token } = await register();
    const put = await authed(token, '/me', {
      method: 'PUT',
      body: JSON.stringify({ ageBand: '20代後半', hobbies: ['読書'], mbti: 'ENTP' }),
    });
    expect(put.status).toBe(200);
    const res = await authed(token, '/me');
    const body = (await res.json()) as { ageBand: string; hobbies: string[]; mbti: string };
    expect(body.ageBand).toBe('20代後半');
    expect(body.hobbies).toEqual(['読書']);
    expect(body.mbti).toBe('ENTP');
  });
});
