import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '@/store/useAppStore';

beforeEach(() => {
  useAppStore.getState().resetForTest();
  useAppStore.getState().setDraftAge('30代');
  useAppStore.getState().toggleDraftHobby('映画');
  useAppStore.getState().setDraftMbti('INFJ');
  useAppStore.getState().completeProfile();
});

describe('completeProfile', () => {
  it('draft から profile を確定する', () => {
    expect(useAppStore.getState().profile).toEqual({ ageBand: '30代', hobbies: ['映画'], mbti: 'INFJ' });
  });
});

describe('checkIn', () => {
  it('チェックインすると店が切り替わる(同時に1店舗のみ)', () => {
    const s = useAppStore.getState();
    s.checkIn('v-cielo');
    expect(useAppStore.getState().myVenueId).toBe('v-cielo');
    s.checkIn('v-noir');
    expect(useAppStore.getState().myVenueId).toBe('v-noir');
  });
  it('checkOut で解除される', () => {
    useAppStore.getState().checkIn('v-cielo');
    useAppStore.getState().checkOut();
    expect(useAppStore.getState().myVenueId).toBeNull();
    expect(useAppStore.getState().myCheckedInAt).toBeNull();
  });
});

describe('sendLike', () => {
  it('いいねでチャットが解禁され system メッセージが入る', () => {
    useAppStore.getState().sendLike('p1');
    const state = useAppStore.getState();
    expect(state.likedIds).toContain('p1');
    expect(state.chats['p1']).toHaveLength(1);
    expect(state.chats['p1'][0].from).toBe('system');
    expect(state.chats['p1'][0].text).toBe('いいねが届いたので、チャットができるようになりました');
  });
  it('二重いいねでメッセージは増えない', () => {
    useAppStore.getState().sendLike('p1');
    useAppStore.getState().sendLike('p1');
    expect(useAppStore.getState().chats['p1']).toHaveLength(1);
  });
});

describe('sendMessage', () => {
  it('自分のメッセージが積まれる', () => {
    useAppStore.getState().sendLike('p1');
    useAppStore.getState().sendMessage('p1', 'こんばんは');
    const msgs = useAppStore.getState().chats['p1'];
    expect(msgs.at(-1)?.from).toBe('me');
    expect(msgs.at(-1)?.text).toBe('こんばんは');
  });
  it('receiveReply で相手の定型返信が積まれる', () => {
    useAppStore.getState().sendLike('p1');
    useAppStore.getState().sendMessage('p1', 'こんばんは');
    useAppStore.getState().receiveReply('p1');
    expect(useAppStore.getState().chats['p1'].at(-1)?.from).toBe('them');
  });
});
