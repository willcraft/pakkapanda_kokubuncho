import { Hono } from 'hono';

import { db } from '../db/client';
import { userHobbies, users } from '../db/schema';
import type { AppEnv } from '../index';
import { generateToken, hashToken } from '../lib/auth';
import { jsonBody, parse, registerSchema } from '../lib/validate';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/auth/register', async (c) => {
  const body = parse(registerSchema, await jsonBody(c.req));
  const userId = crypto.randomUUID();
  const token = generateToken();
  const d = db(c.env);

  await d.insert(users).values({
    id: userId,
    tokenHash: await hashToken(token),
    ageBand: body.ageBand,
    mbti: body.mbti,
    createdAt: Date.now(),
  });
  await d.insert(userHobbies).values(body.hobbies.map((hobby) => ({ userId, hobby })));

  return c.json({ userId, token });
});
