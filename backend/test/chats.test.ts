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
  lastMessage: { id: string; text: string; from: string; kind: string } | null;
}

interface Message {
  id: string;
  text: string;
  from: 'me' | 'them';
  kind: 'text' | 'like';
}

describe('POST /likes → チャット解禁', () => {
  it('片方向いいねで双方の GET /chats に会話が現れ、いいね通知メッセージが入る', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);

    const aChats = (await (await authed(a.token, '/chats')).json()) as ChatRow[];
    const bChats = (await (await authed(b.token, '/chats')).json()) as ChatRow[];
    expect(aChats.map((r) => r.peer.userId)).toEqual([b.userId]);
    expect(bChats.map((r) => r.peer.userId)).toEqual([a.userId]);
    // いいねした側から見ると自分発の like メッセージ、受け取った側は相手発
    expect(aChats[0].lastMessage?.kind).toBe('like');
    expect(aChats[0].lastMessage?.from).toBe('me');
    expect(bChats[0].lastMessage?.kind).toBe('like');
    expect(bChats[0].lastMessage?.from).toBe('them');
  });

  it('重複いいねで like メッセージは増えない', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await like(a.token, b.userId);
    const msgs = (await (await authed(a.token, `/chats/${b.userId}/messages`)).json()) as Message[];
    expect(msgs.filter((m) => m.kind === 'like')).toHaveLength(1);
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
  it('未解禁ペアの送信は 403', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    expect((await send(a.token, b.userId, 'やあ')).status).toBe(403);
  });

  it('送信 → 双方から取得できる(from は視点で変わる)', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    expect((await send(a.token, b.userId, 'こんばんは')).status).toBe(200);
    expect((await send(b.token, a.userId, 'こんばんは!')).status).toBe(200);

    const aMsgs = (await (await authed(a.token, `/chats/${b.userId}/messages`)).json()) as Message[];
    // 先頭はいいね通知、以降がテキスト
    expect(aMsgs.map((m) => [m.kind, m.from])).toEqual([
      ['like', 'me'],
      ['text', 'me'],
      ['text', 'them'],
    ]);
    expect(aMsgs[1].text).toBe('こんばんは');
    const bMsgs = (await (await authed(b.token, `/chats/${a.userId}/messages`)).json()) as Message[];
    expect(bMsgs.map((m) => m.from)).toEqual(['them', 'them', 'me']);
  });

  it('after カーソルで差分のみ取得できる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
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
    expect((await send(a.token, b.userId, 'あ'.repeat(1001))).status).toBe(400);
  });

  it('GET /chats の lastMessage が最新メッセージになる', async () => {
    const a = await register();
    const b = await register({ mbti: 'ENFP', hobbies: ['映画'] });
    await like(a.token, b.userId);
    await send(a.token, b.userId, '最初');
    await send(a.token, b.userId, '最新');
    const chats = (await (await authed(a.token, '/chats')).json()) as ChatRow[];
    expect(chats[0].lastMessage?.text).toBe('最新');
    expect(chats[0].lastMessage?.from).toBe('me');
  });
});
