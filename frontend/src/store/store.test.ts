import { beforeEach, describe, expect, it } from 'vitest';

import type { ApiMessage, ApiPerson } from '@/api/types';
import { useAppStore } from '@/store/useAppStore';

function message(id: string): ApiMessage {
  return { id, text: `msg-${id}`, from: 'me', kind: 'text', createdAt: 0 };
}

function person(userId: string, liked = false): ApiPerson {
  return {
    userId,
    mbti: 'ENFP',
    ageBand: '30代',
    hobbies: ['映画'],
    lat: null,
    lng: null,
    venueId: null,
    compat: { total: 90, rank: 'S' },
    liked,
  };
}

beforeEach(() => {
  useAppStore.setState({
    draft: { hobbies: [] },
    matches: [],
    nearby: [],
    messages: {},
  });
});

describe('draft', () => {
  it('趣味の選択をトグルできる', () => {
    const s = useAppStore.getState();
    s.toggleDraftHobby('映画');
    s.toggleDraftHobby('旅行');
    expect(useAppStore.getState().draft.hobbies).toEqual(['映画', '旅行']);
    useAppStore.getState().toggleDraftHobby('映画');
    expect(useAppStore.getState().draft.hobbies).toEqual(['旅行']);
  });
});

describe('appendMessages', () => {
  it('既知IDのメッセージは重複追加されない', () => {
    const s = useAppStore.getState();
    s.setMessages('p1', [message('a')]);
    s.appendMessages('p1', [message('a'), message('b')]);
    expect(useAppStore.getState().messages['p1'].map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('markLiked', () => {
  it('matches と nearby の該当ユーザーの liked が true になる', () => {
    const s = useAppStore.getState();
    s.setMatches([person('p1'), person('p2')]);
    s.setNearby([person('p1')]);
    s.markLiked('p1');
    const state = useAppStore.getState();
    expect(state.matches.find((p) => p.userId === 'p1')?.liked).toBe(true);
    expect(state.matches.find((p) => p.userId === 'p2')?.liked).toBe(false);
    expect(state.nearby[0].liked).toBe(true);
  });
});
