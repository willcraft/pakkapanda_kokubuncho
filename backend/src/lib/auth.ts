import { eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';

import { db } from '../db/client';
import { users } from '../db/schema';
import type { AppEnv } from '../index';
import { ApiError } from './errors';

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) throw new ApiError('UNAUTHORIZED', '認証が必要です');

  const tokenHash = await hashToken(token);
  const rows = await db(c.env).select({ id: users.id }).from(users).where(eq(users.tokenHash, tokenHash));
  if (rows.length === 0) throw new ApiError('UNAUTHORIZED', '認証が必要です');

  c.set('userId', rows[0].id);
  await next();
};
