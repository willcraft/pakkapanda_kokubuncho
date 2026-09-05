import { API_URL } from './config';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

const TIMEOUT_MS = 10_000;

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // 到達できないホストへのfetchは無期限にハングし得るため、必ずタイムアウトさせる
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new ApiRequestError('TIMEOUT', 'サーバーに接続できません(タイムアウト)', 0);
    }
    throw new ApiRequestError('NETWORK', 'サーバーに接続できません', 0);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let code = 'INTERNAL';
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // JSONでないエラーレスポンスはそのまま
    }
    throw new ApiRequestError(code, message, res.status);
  }
  return (await res.json()) as T;
}
