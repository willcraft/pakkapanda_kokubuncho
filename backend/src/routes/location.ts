import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../db/client';
import { userLocations } from '../db/schema';
import { inArea } from '../domain/area';
import type { AppEnv } from '../index';
import { jsonBody, parse } from '../lib/validate';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const locationRoutes = new Hono<AppEnv>();

locationRoutes.post('/location', async (c) => {
  const userId = c.get('userId');
  const body = parse(locationSchema, await jsonBody(c.req));

  await db(c.env)
    .insert(userLocations)
    .values({ userId, lat: body.lat, lng: body.lng, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: userLocations.userId,
      set: { lat: body.lat, lng: body.lng, updatedAt: Date.now() },
    });

  return c.json({ inArea: inArea(body) });
});
