import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('CORS (web開発用)', () => {
  it('localhost オリジンの preflight が許可される', async () => {
    const res = await SELF.fetch('https://api.test/auth/register', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:8081',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });
    expect(res.status).toBeLessThan(300);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:8081');
    expect(res.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('authorization');
  });

  it('localhost 以外のオリジンは許可しない', async () => {
    const res = await SELF.fetch('https://api.test/auth/register', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'POST',
      },
    });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
