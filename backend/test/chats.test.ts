import { describe, expect, it } from 'vitest';

import { authed, register, sendLocation } from './helpers';

async function like(token: string, toUserId: string): Promise<Response> {
  return authed(token, '/likes', { method: 'POST', body: JSON.stringify({ toUserId }) });
}

async function send(token: string, userId: string, text: string): Promise<Response> {
  return authed(token, `/chats/${userId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
}

interface ChatRow {
  peer: { userId: string; mbti: string };
  matched: boolean;
  lastMessage: { id: string; text: string; from: string; kind: string } | null;
}

interface Message {
  id: string;
  text: string;
  from: 'me' | 'them';
  kind: 'text' | 'like';
}

describe('いいね → マッチ → チャット解禁', () => {
  it('片方向いいねでは GET /chats に会話は現れない(マッチ前)', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    expect((await (await authed(a.token, '/chats')).json()) as ChatRow[]).toEqual([]);
    expect((await (await authed(b.token, '/chats')).json()) as ChatRow[]).toEqual([]);
  });

  it('相互いいねで双方の GET /chats に matched な会話が現れる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    const aChats = (await (await authed(a.token, '/chats')).json()) as ChatRow[];
    const bChats = (await (await authed(b.token, '/chats')).json()) as ChatRow[];
    expect(aChats.map((r) => r.peer.userId)).toEqual([b.userId]);
    expect(bChats.map((r) => r.peer.userId)).toEqual([a.userId]);
    expect(aChats[0].matched).toBe(true);
    // 最後のメッセージは相手からのいいね(=マッチ成立)通知
    expect(aChats[0].lastMessage?.kind).toBe('like');
    expect(aChats[0].lastMessage?.from).toBe('them');
  });

  it('重複いいねで like メッセージは増えない', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    await like(a.token, b.userId);
    const msgs = (await (await authed(a.token, `/chats/${b.userId}/messages`)).json()) as Message[];
    expect(msgs.filter((m) => m.kind === 'like')).toHaveLength(2); // 各方向1件ずつ
  });

  it('重複いいねは 200(冪等)', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    expect((await like(a.token, b.userId)).status).toBe(200);
    expect((await like(a.token, b.userId)).status).toBe(200);
  });

  it('自分へのいいねは 400、存在しない相手は 404', async () => {
    const a = await register();
    expect((await like(a.token, a.userId)).status).toBe(400);
    expect((await like(a.token, crypto.randomUUID())).status).toBe(404);
  });

  it('いいね後は matches の liked が true になる', async () => {
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await sendLocation(b.token);
    const a = await register();
    await like(a.token, b.userId);
    const list = (await (await authed(a.token, '/matches')).json()) as { userId: string; liked: boolean }[];
    expect(list.find((p) => p.userId === b.userId)?.liked).toBe(true);
  });
});

describe('メッセージ送受信', () => {
  it('いいねが一切ないペアの送信は 403', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    expect((await send(a.token, b.userId, 'やあ')).status).toBe(403);
  });

  it('片方向いいねだけでは送信も閲覧もできない(403)。相互いいねで可能になる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    expect((await send(a.token, b.userId, 'やあ')).status).toBe(403);
    expect((await authed(a.token, `/chats/${b.userId}/messages`)).status).toBe(403);
    await like(b.token, a.userId);
    expect((await send(a.token, b.userId, 'やあ')).status).toBe(200);
  });

  it('GET /likes/received: 自分にいいねをくれた未対応の相手が返り、いいねを返すと消える', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(b.token, a.userId);
    const received = (await (await authed(a.token, '/likes/received')).json()) as {
      userId: string;
      mbti: string;
      compat: { rank: string };
    }[];
    expect(received.map((p) => p.userId)).toEqual([b.userId]);
    expect(received[0].mbti).toBe('ENFP');
    await like(a.token, b.userId);
    expect((await (await authed(a.token, '/likes/received')).json()) as unknown[]).toEqual([]);
  });

  it('送信 → 双方から取得できる(from は視点で変わる)', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    expect((await send(a.token, b.userId, 'こんばんは')).status).toBe(200);
    expect((await send(b.token, a.userId, 'こんばんは!')).status).toBe(200);

    const aMsgs = (await (await authed(a.token, `/chats/${b.userId}/messages`)).json()) as Message[];
    // 先頭は双方のいいね通知、以降がテキスト
    expect(aMsgs.map((m) => [m.kind, m.from])).toEqual([
      ['like', 'me'],
      ['like', 'them'],
      ['text', 'me'],
      ['text', 'them'],
    ]);
    expect(aMsgs[2].text).toBe('こんばんは');
    const bMsgs = (await (await authed(b.token, `/chats/${a.userId}/messages`)).json()) as Message[];
    expect(bMsgs.map((m) => m.from)).toEqual(['them', 'me', 'them', 'me']);
  });

  it('after カーソルで差分のみ取得できる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    await send(a.token, b.userId, '1通目');
    const first = (await (await authed(a.token, `/chats/${b.userId}/messages`)).json()) as Message[];
    await send(a.token, b.userId, '2通目');
    const diff = (await (
      await authed(a.token, `/chats/${b.userId}/messages?after=${first.at(-1)!.id}`)
    ).json()) as Message[];
    expect(diff.map((m) => m.text)).toEqual(['2通目']);
  });

  it('1001文字は 400', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    expect((await send(a.token, b.userId, 'あ'.repeat(1001))).status).toBe(400);
  });

  it('GET /chats の lastMessage が最新メッセージになる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(b.token, a.userId);
    await send(a.token, b.userId, '最初');
    await send(a.token, b.userId, '最新');
    const chats = (await (await authed(a.token, '/chats')).json()) as ChatRow[];
    expect(chats[0].lastMessage?.text).toBe('最新');
    expect(chats[0].lastMessage?.from).toBe('me');
  });
});
