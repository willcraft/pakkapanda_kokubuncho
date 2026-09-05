// 画面が使う唯一のデータ入口。バックエンド(Cloudflare Workers + Hono + D1)の
// REST APIを呼び、結果を zustand ストアにキャッシュする。
import { useEffect, useRef, useState } from 'react';

import { request, setAuthToken } from '@/api/http';
import { clearToken, loadToken, saveToken } from '@/api/tokenStore';
import type {
  ApiChatRow,
  ApiMessage,
  ApiMyCheckin,
  ApiPerson,
  ApiVenue,
  ApiVenueDetail,
} from '@/api/types';
import { KOKUBUNCHO_CENTER } from '@/data/seed';
import { useAppStore } from '@/store/useAppStore';
import type { Profile } from '@/types';

const EMPTY_MESSAGES: ApiMessage[] = [];

// ---- ストア購読フック --------------------------------------------------------

export const useAuthLoaded = () => useAppStore((s) => s.authLoaded);
export const useMyProfile = () => useAppStore((s) => s.profile);
export const useDraft = () => useAppStore((s) => s.draft);
export const useVenueSummaries = () => useAppStore((s) => s.venues);
export const useNearby = () => useAppStore((s) => s.nearby);
export const useMatchesList = () => useAppStore((s) => s.matches);
export const useMyCheckin = () => useAppStore((s) => s.myCheckin);
export const useChatsList = () => useAppStore((s) => s.chats);
export const useMessages = (peerId: string) =>
  useAppStore((s) => s.messages[peerId] ?? EMPTY_MESSAGES);
export const useVenueSummary = (venueId: string | null | undefined) =>
  useAppStore((s) => s.venues.find((v) => v.id === venueId));

// ---- ポーリング --------------------------------------------------------------

/** マウント時に即時実行し、以後 ms 間隔で fn を呼ぶ(仕様書§6のポーリング規約) */
export function usePoll(fn: () => void | Promise<void>, ms: number, enabled = true): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const run = () => void Promise.resolve(fnRef.current()).catch(() => {});
    run();
    const timer = setInterval(run, ms);
    return () => clearInterval(timer);
  }, [ms, enabled]);
}

// ---- 取得(refresh)----------------------------------------------------------

interface MeResponse extends Profile {
  userId: string;
  checkin: ApiMyCheckin | null;
}

async function refreshMe(): Promise<void> {
  const me = await request<MeResponse>('/me');
  const s = useAppStore.getState();
  s.setUserId(me.userId);
  s.setProfile({ ageBand: me.ageBand, hobbies: me.hobbies, mbti: me.mbti });
  s.setMyCheckin(me.checkin);
}

async function refreshVenues(): Promise<void> {
  useAppStore.getState().setVenues(await request<ApiVenue[]>('/venues'));
}

async function refreshNearby(): Promise<void> {
  useAppStore.getState().setNearby(await request<ApiPerson[]>('/people/nearby'));
}

async function refreshMatches(): Promise<void> {
  useAppStore.getState().setMatches(await request<ApiPerson[]>('/matches?limit=3'));
}

async function refreshChats(): Promise<void> {
  useAppStore.getState().setChats(await request<ApiChatRow[]>('/chats'));
}

async function refreshMessages(peerId: string): Promise<void> {
  const s = useAppStore.getState();
  const existing = s.messages[peerId] ?? [];
  const last = existing[existing.length - 1];
  const path = last
    ? `/chats/${peerId}/messages?after=${encodeURIComponent(last.id)}`
    : `/chats/${peerId}/messages`;
  const incoming = await request<ApiMessage[]>(path);
  if (last) s.appendMessages(peerId, incoming);
  else s.setMessages(peerId, incoming);
}

// ---- 起動・心拍 --------------------------------------------------------------

/** アプリ起動時に一度だけ: 保存済みトークンでプロフィールを復元する */
export function useBootstrap(): void {
  useEffect(() => {
    void (async () => {
      const token = await loadToken();
      if (token) {
        setAuthToken(token);
        try {
          await refreshMe();
        } catch {
          // トークン失効(サーバー側リセット等)→ 未登録として扱う
          setAuthToken(null);
          await clearToken();
        }
      }
      useAppStore.getState().setAuthLoaded(true);
    })();
  }, []);
}

/**
 * 位置心拍(60秒間隔)。モックでは国分町中心の固定座標を送る
 * (実GPSだとエリア外になり何も表示されないため。実装時はexpo-locationに差し替え)
 */
export function useHeartbeat(): void {
  const profile = useMyProfile();
  usePoll(() => request('/location', { method: 'POST', body: KOKUBUNCHO_CENTER_LATLNG }), 60_000, !!profile);
}

const KOKUBUNCHO_CENTER_LATLNG = {
  lat: KOKUBUNCHO_CENTER.latitude,
  lng: KOKUBUNCHO_CENTER.longitude,
};

// ---- 画面ごとの詳細取得 ------------------------------------------------------

/** 店舗詳細(10秒ポーリング) */
export function useVenueDetail(venueId: string): ApiVenueDetail | null {
  const [detail, setDetail] = useState<ApiVenueDetail | null>(null);
  usePoll(async () => setDetail(await request<ApiVenueDetail>(`/venues/${venueId}`)), 10_000);
  return detail;
}

/** 相手プロフィール(単発+refresh) */
export function usePersonDetail(personId: string): {
  person: ApiPerson | null;
  refresh: () => Promise<void>;
} {
  const [person, setPerson] = useState<ApiPerson | null>(null);
  const refresh = async () => setPerson(await request<ApiPerson>(`/people/${personId}`));
  useEffect(() => {
    void refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);
  return { person, refresh };
}

// ---- 画面ポーリングのまとめ(仕様書§6)---------------------------------------

export function useHomePolling(): void {
  usePoll(async () => {
    await Promise.all([refreshVenues(), refreshNearby(), refreshMatches()]);
  }, 10_000);
}

export function useMatchesPolling(): void {
  usePoll(refreshMatches, 15_000);
}

export function useChatsPolling(): void {
  usePoll(refreshChats, 10_000);
}

export function useMessagesPolling(peerId: string): void {
  usePoll(() => refreshMessages(peerId), 3_000);
}

// ---- 更新系アクション --------------------------------------------------------

export const api = {
  setDraftAge: (v: Parameters<ReturnType<typeof useAppStore.getState>['setDraftAge']>[0]) =>
    useAppStore.getState().setDraftAge(v),
  toggleDraftHobby: (v: Parameters<ReturnType<typeof useAppStore.getState>['toggleDraftHobby']>[0]) =>
    useAppStore.getState().toggleDraftHobby(v),
  setDraftMbti: (v: Parameters<ReturnType<typeof useAppStore.getState>['setDraftMbti']>[0]) =>
    useAppStore.getState().setDraftMbti(v),

  /** プロフィール編集開始時に現在値をドラフトへ複写する */
  prefillDraftFromProfile: () => {
    const { profile, setDraft } = useAppStore.getState();
    if (profile) setDraft({ ageBand: profile.ageBand, hobbies: [...profile.hobbies], mbti: profile.mbti });
  },

  /** 初回は /auth/register、登録済み(編集)は PUT /me */
  completeProfile: async (): Promise<void> => {
    const s = useAppStore.getState();
    const { draft } = s;
    if (!draft.ageBand || !draft.mbti || draft.hobbies.length === 0) return;
    const profile: Profile = { ageBand: draft.ageBand, hobbies: draft.hobbies, mbti: draft.mbti };

    if (s.profile) {
      await request('/me', { method: 'PUT', body: profile });
    } else {
      const res = await request<{ userId: string; token: string }>('/auth/register', {
        method: 'POST',
        body: { ...profile, ageConfirmed: true },
      });
      setAuthToken(res.token);
      await saveToken(res.token);
      s.setUserId(res.userId);
    }
    s.setProfile(profile);
    // すぐエリア内として表示されるように心拍を1回送る
    await request('/location', { method: 'POST', body: KOKUBUNCHO_CENTER_LATLNG }).catch(() => {});
  },

  checkIn: async (venueId: string): Promise<void> => {
    const res = await request<{ checkinId: string; venueId: string; checkedInAt: number }>('/checkins', {
      method: 'POST',
      body: { venueId },
    });
    useAppStore.getState().setMyCheckin({ venueId: res.venueId, checkedInAt: res.checkedInAt });
    await refreshVenues().catch(() => {});
  },

  checkOut: async (): Promise<void> => {
    await request('/checkins/current', { method: 'DELETE' });
    useAppStore.getState().setMyCheckin(null);
    await refreshVenues().catch(() => {});
  },

  sendLike: async (personId: string): Promise<void> => {
    await request('/likes', { method: 'POST', body: { toUserId: personId } });
    useAppStore.getState().markLiked(personId);
    await refreshChats().catch(() => {});
  },

  sendMessage: async (peerId: string, text: string): Promise<void> => {
    if (!text.trim()) return;
    const message = await request<ApiMessage>(`/chats/${peerId}/messages`, {
      method: 'POST',
      body: { text: text.trim() },
    });
    useAppStore.getState().appendMessages(peerId, [message]);
  },
};
