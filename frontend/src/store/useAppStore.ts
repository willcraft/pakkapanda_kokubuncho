import { create } from 'zustand';

import { PEOPLE, VENUES } from '@/data/seed';
import type { AgeBand, ChatMessage, Hobby, MbtiType, Person, Profile, Venue } from '@/types';

const SYSTEM_UNLOCK_TEXT = 'いいねが届いたので、チャットができるようになりました';

const CANNED_REPLIES = [
  'いいですね!今度ぜひ話しましょう',
  'ありがとうございます、嬉しいです!',
  'そうなんですね!もっと聞きたいです',
  '今日はこのあとどうされるんですか?',
  'わかります、それすごく好きです',
];

interface Draft {
  ageBand?: AgeBand;
  hobbies: Hobby[];
  mbti?: MbtiType;
}

let msgSeq = 0;
const nextMsgId = () => `m${++msgSeq}`;

interface AppState {
  profile: Profile | null;
  draft: Draft;
  people: Person[];
  venues: Venue[];
  myVenueId: string | null;
  myCheckedInAt: number | null;
  likedIds: string[];
  chats: Record<string, ChatMessage[]>;
  replyCount: number;

  setDraftAge: (ageBand: AgeBand) => void;
  toggleDraftHobby: (hobby: Hobby) => void;
  setDraftMbti: (mbti: MbtiType) => void;
  completeProfile: () => void;
  checkIn: (venueId: string) => void;
  checkOut: () => void;
  sendLike: (personId: string) => void;
  sendMessage: (personId: string, text: string) => void;
  receiveReply: (personId: string) => void;
  resetForTest: () => void;
}

const initialState = () => ({
  profile: null as Profile | null,
  draft: { hobbies: [] } as Draft,
  people: PEOPLE,
  venues: VENUES,
  myVenueId: null as string | null,
  myCheckedInAt: null as number | null,
  likedIds: [] as string[],
  chats: {} as Record<string, ChatMessage[]>,
  replyCount: 0,
});

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState(),

  setDraftAge: (ageBand) => set((s) => ({ draft: { ...s.draft, ageBand } })),

  toggleDraftHobby: (hobby) =>
    set((s) => ({
      draft: {
        ...s.draft,
        hobbies: s.draft.hobbies.includes(hobby)
          ? s.draft.hobbies.filter((h) => h !== hobby)
          : [...s.draft.hobbies, hobby],
      },
    })),

  setDraftMbti: (mbti) => set((s) => ({ draft: { ...s.draft, mbti } })),

  completeProfile: () => {
    const { draft } = get();
    if (!draft.ageBand || !draft.mbti || draft.hobbies.length === 0) return;
    set({ profile: { ageBand: draft.ageBand, hobbies: draft.hobbies, mbti: draft.mbti } });
  },

  checkIn: (venueId) => set({ myVenueId: venueId, myCheckedInAt: Date.now() }),

  checkOut: () => set({ myVenueId: null, myCheckedInAt: null }),

  sendLike: (personId) => {
    const { likedIds, chats } = get();
    if (likedIds.includes(personId)) return;
    set({
      likedIds: [...likedIds, personId],
      chats: {
        ...chats,
        [personId]: chats[personId] ?? [
          { id: nextMsgId(), personId, from: 'system', text: SYSTEM_UNLOCK_TEXT, at: Date.now() },
        ],
      },
    });
  },

  sendMessage: (personId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set((s) => ({
      chats: {
        ...s.chats,
        [personId]: [
          ...(s.chats[personId] ?? []),
          { id: nextMsgId(), personId, from: 'me', text: trimmed, at: Date.now() },
        ],
      },
    }));
    setTimeout(() => get().receiveReply(personId), 1500);
  },

  receiveReply: (personId) =>
    set((s) => ({
      replyCount: s.replyCount + 1,
      chats: {
        ...s.chats,
        [personId]: [
          ...(s.chats[personId] ?? []),
          {
            id: nextMsgId(),
            personId,
            from: 'them',
            text: CANNED_REPLIES[s.replyCount % CANNED_REPLIES.length],
            at: Date.now(),
          },
        ],
      },
    })),

  resetForTest: () => set(initialState()),
}));
