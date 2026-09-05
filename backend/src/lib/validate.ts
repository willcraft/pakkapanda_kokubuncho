import { z } from 'zod';

import { AGE_BANDS, HOBBIES, MBTI_TYPES } from '../../../shared/types';
import { ApiError } from './errors';

export const profileSchema = z.object({
  ageBand: z.enum(AGE_BANDS),
  hobbies: z.array(z.enum(HOBBIES)).min(1).max(10),
  mbti: z.enum(MBTI_TYPES),
});

export const registerSchema = profileSchema.extend({
  ageConfirmed: z.literal(true),
});

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError('BAD_REQUEST', result.error.issues[0]?.message ?? '不正なリクエストです');
  }
  return result.data;
}

export async function jsonBody(req: { json(): Promise<unknown> }): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError('BAD_REQUEST', 'JSONボディが必要です');
  }
}
