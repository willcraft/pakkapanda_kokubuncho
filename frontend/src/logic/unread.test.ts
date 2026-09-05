import { describe, expect, it } from 'vitest';

import { countUnreadChats } from '@/logic/unread';

const chat = (userId: string, lastId: string | null, from: 'me' | 'them' = 'them') => ({
  peer: { userId },
  lastMessage: lastId ? { id: lastId, from } : null,
});

describe('countUnreadChats', () => {
  it('未読(相手発の最終メッセージが既読印より新しい)を数える', () => {
    const chats = [chat('a', '02X'), chat('b', '01X')];
    expect(countUnreadChats(chats, { b: '01X' })).toBe(1); // a が未読
  });

  it('既読済み・自分発・メッセージなしは数えない', () => {
    const chats = [chat('a', '02X'), chat('b', '03X', 'me'), chat('c', null)];
    expect(countUnreadChats(chats, { a: '02X' })).toBe(0);
  });

  it('既読印がない会話は相手発なら未読', () => {
    expect(countUnreadChats([chat('a', '01X')], {})).toBe(1);
  });
});
