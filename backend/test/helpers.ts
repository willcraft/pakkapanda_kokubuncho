import { SELF } from 'cloudflare:test';

export interface RegisterBody {
  ageBand?: string;
  hobbies?: string[];
  mbti?: string;
  ageConfirmed?: boolean;
}

export const VALID_REGISTER: RegisterBody = {
  ageBand: '30代',
  hobbies: ['映画', '旅行'],
  mbti: 'INFJ',
  ageConfirmed: true,
};

export async function register(overrides: RegisterBody = {}): Promise<{ userId: string; token: string }> {
  const res = await SELF.fetch('https://api.test/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...VALID_REGISTER, ...overrides }),
  });
  if (res.status !== 200) throw new Error(`register failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { userId: string; token: string };
}

export async function authed(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return SELF.fetch(`https://api.test${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

/** エリア内(国分町中心)の座標 */
export const IN_AREA = { lat: 38.261, lng: 140.8722 };
/** エリア外(仙台駅あたり、中心から1km以上) */
export const OUT_OF_AREA = { lat: 38.2601, lng: 140.8825 };

export async function sendLocation(token: string, coord = IN_AREA): Promise<Response> {
  return authed(token, '/location', { method: 'POST', body: JSON.stringify(coord) });
}
