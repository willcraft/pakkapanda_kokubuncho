import { describe, expect, it } from 'vitest';

import { normalizeApiUrl } from '@/api/config';

describe('normalizeApiUrl', () => {
  it('スキーム省略時は http:// を補う', () => {
    expect(normalizeApiUrl('192.168.151.4:8787')).toBe('http://192.168.151.4:8787');
  });
  it('スキーム付きはそのまま', () => {
    expect(normalizeApiUrl('https://yoawase-api.example.workers.dev')).toBe(
      'https://yoawase-api.example.workers.dev',
    );
  });
  it('末尾スラッシュを除去する', () => {
    expect(normalizeApiUrl('http://localhost:8787/')).toBe('http://localhost:8787');
  });
});
