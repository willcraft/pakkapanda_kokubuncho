import { drizzle } from 'drizzle-orm/d1';

import type { Env } from '../index';
import * as schema from './schema';

export function db(env: Env) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof db>;
