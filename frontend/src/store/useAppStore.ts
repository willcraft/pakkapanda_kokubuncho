// サーバーレスポンスのキャッシュ+オンボーディングのドラフト。
// データの取得・更新は src/api/client.ts が担い、このストアは置き場に徹する。
import { create } from 'zustand';

import type {
  ApiChatRow,
  ApiMessage,
  ApiMyCheckin,
  ApiPerson,
  ApiVenue,
} from '@/api/types';
import type { AgeBand, Hobby, MbtiType, Profile } from '@/types';

interface Draft {
  ageBand?: AgeBand;
  hobbies: Hobby[];
  mbti?: MbtiType;
}

interface AppState {
  authLoaded: boolean;
  userId: string | null;
  profile: Profile | null;
  draft: Draft;

  venues: ApiVenue[];
  nearby: ApiPerson[];
  matches: ApiPerson[];
  myCheckin: ApiMyCheckin | null;
  chats: ApiChatRow[];
  messages: Record<string, ApiMessage[]>;
  /** サーバーに最後に報告した自分の位置(マップの自分ピン表示に使う) */
  myLocation: { latitude: number; longitude: number } | null;
  /** peerId → 既読済み最終メッセージID(未読バッジ用。メモリ内のみ) */
  readMarks: Record<string, string>;

  setAuthLoaded: (loaded: boolean) => void;
  setUserId: (userId: string | null) => void;
  setProfile: (profile: Profile | null) => void;
  setDraftAge: (ageBand: AgeBand) => void;
  toggleDraftHobby: (hobby: Hobby) => void;
  setDraftMbti: (mbti: MbtiType) => void;
  setDraft: (draft: Draft) => void;

  setVenues: (venues: ApiVenue[]) => void;
  setNearby: (nearby: ApiPerson[]) => void;
  setMatches: (matches: ApiPerson[]) => void;
  setMyCheckin: (checkin: ApiMyCheckin | null) => void;
  setMyLocation: (loc: { latitude: number; longitude: number } | null) => void;
  markRead: (peerId: string, messageId: string) => void;
  setChats: (chats: ApiChatRow[]) => void;
  setMessages: (peerId: string, messages: ApiMessage[]) => void;
  appendMessages: (peerId: string, messages: ApiMessage[]) => void;
  markLiked: (personId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  authLoaded: false,
  userId: null,
  profile: null,
  draft: { hobbies: [] },

  venues: [],
  nearby: [],
  matches: [],
  myCheckin: null,
  chats: [],
  messages: {},
  myLocation: null,
  readMarks: {},

  setAuthLoaded: (authLoaded) => set({ authLoaded }),
  setUserId: (userId) => set({ userId }),
  setProfile: (profile) => set({ profile }),
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
  setDraft: (draft) => set({ draft }),

  setVenues: (venues) => set({ venues }),
  setNearby: (nearby) => set({ nearby }),
  setMatches: (matches) => set({ matches }),
  setMyCheckin: (myCheckin) => set({ myCheckin }),
  setMyLocation: (myLocation) => set({ myLocation }),
  markRead: (peerId, messageId) =>
    set((s) =>
      (s.readMarks[peerId] ?? '') >= messageId
        ? s
        : { readMarks: { ...s.readMarks, [peerId]: messageId } },
    ),
  setChats: (chats) => set({ chats }),
  setMessages: (peerId, messages) => set((s) => ({ messages: { ...s.messages, [peerId]: messages } })),
  appendMessages: (peerId, incoming) =>
    set((s) => {
      const existing = s.messages[peerId] ?? [];
      const known = new Set(existing.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return s;
      return { messages: { ...s.messages, [peerId]: [...existing, ...fresh] } };
    }),
  markLiked: (personId) =>
    set((s) => ({
      matches: s.matches.map((p) => (p.userId === personId ? { ...p, liked: true } : p)),
      nearby: s.nearby.map((p) => (p.userId === personId ? { ...p, liked: true } : p)),
    })),
}));
