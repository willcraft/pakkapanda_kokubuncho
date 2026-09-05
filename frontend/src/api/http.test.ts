import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError, request } from '@/api/http';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('request timeout', () => {
  it('応答がない場合は10秒でタイムアウトしてrejectされる', async () => {
    vi.useFakeTimers();
    // 応答を返さないがabort signalには従うfetchのモック
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
          );
        });
      }),
    );

    const promise = request('/health').catch((e) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    const error = await promise;
    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).code).toBe('TIMEOUT');
  });
});
