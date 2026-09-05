import { and, desc, eq, gt, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { ulid } from 'ulidx';
import { z } from 'zod';

import { db } from '../db/client';
import { likes, messages, users } from '../db/schema';
import type { AppEnv } from '../index';
import { ApiError } from '../lib/errors';
import { jsonBody, parse } from '../lib/validate';

const messageSchema = z.object({ text: z.string().min(1).max(1000) });

export const chatRoutes = new Hono<AppEnv>();

function pairFilter(a: string, b: string) {
  return or(
    and(eq(messages.fromUser, a), eq(messages.toUser, b)),
    and(eq(messages.fromUser, b), eq(messages.toUser, a)),
  );
}

async function assertUnlocked(d: ReturnType<typeof db>, me: string, peer: string): Promise<void> {
  const rows = await d
    .select({ fromUser: likes.fromUser })
    .from(likes)
    .where(
      or(
        and(eq(likes.fromUser, me), eq(likes.toUser, peer)),
        and(eq(likes.fromUser, peer), eq(likes.toUser, me)),
      ),
    );
  if (rows.length === 0) throw new ApiError('FORBIDDEN', 'チャットが解禁されていません');
}

chatRoutes.get('/chats', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');

  // 解禁済みペア = 自分が関与する likes の相手(双方向あっても1会話)
  const likeRows = await d
    .select({ fromUser: likes.fromUser, toUser: likes.toUser })
    .from(likes)
    .where(or(eq(likes.fromUser, userId), eq(likes.toUser, userId)));
  const peerIds = [...new Set(likeRows.map((r) => (r.fromUser === userId ? r.toUser : r.fromUser)))];
  if (peerIds.length === 0) return c.json([]);

  const result = await Promise.all(
    peerIds.map(async (peerId) => {
      const peer = (
        await d.select({ id: users.id, mbti: users.mbti, ageBand: users.ageBand }).from(users).where(eq(users.id, peerId))
      )[0];
      const last = (
        await d.select().from(messages).where(pairFilter(userId, peerId)).orderBy(desc(messages.id)).limit(1)
      )[0];
      return {
        peer: { userId: peer.id, mbti: peer.mbti, ageBand: peer.ageBand },
        lastMessage: last
          ? {
              id: last.id,
              text: last.text,
              from: last.fromUser === userId ? 'me' : 'them',
              kind: last.kind,
              createdAt: last.createdAt,
            }
          : null,
        sortKey: last?.id ?? '',
      };
    }),
  );
  result.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  return c.json(result.map(({ sortKey: _sortKey, ...row }) => row));
});

chatRoutes.get('/chats/:userId/messages', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const peerId = c.req.param('userId');
  await assertUnlocked(d, userId, peerId);

  const after = c.req.query('after');
  const filter = after ? and(pairFilter(userId, peerId), gt(messages.id, after)) : pairFilter(userId, peerId);
  const rows = await d.select().from(messages).where(filter).orderBy(desc(messages.id)).limit(100);
  rows.reverse(); // 直近100件を古い順で返す

  return c.json(
    rows.map((m) => ({
      id: m.id,
      text: m.text,
      from: m.fromUser === userId ? 'me' : 'them',
      kind: m.kind,
      createdAt: m.createdAt,
    })),
  );
});

chatRoutes.post('/chats/:userId/messages', async (c) => {
  const d = db(c.env);
  const userId = c.get('userId');
  const peerId = c.req.param('userId');
  const body = parse(messageSchema, await jsonBody(c.req));
  await assertUnlocked(d, userId, peerId);

  const message = {
    id: ulid(),
    fromUser: userId,
    toUser: peerId,
    text: body.text,
    kind: 'text',
    createdAt: Date.now(),
  };
  await d.insert(messages).values(message);

  return c.json({ id: message.id, text: message.text, from: 'me', kind: 'text', createdAt: message.createdAt });
});
