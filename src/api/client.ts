// 画面が使う唯一のデータ入口。
// モックでは zustand + 静的シードを返すだけだが、バックエンド実装後は
// 同じシグネチャのまま Node.js + Hono の REST API 呼び出しに差し替える。
import { useMemo } from 'react';

import { compat, type Compat } from '@/logic/compatibility';
import { useAppStore } from '@/store/useAppStore';
import type { AgeBand, ChatMessage, Hobby, MbtiType, Person, Profile, Venue } from '@/types';

export const useVenues = (): Venue[] => useAppStore((s) => s.venues);
export const usePeople = (): Person[] => useAppStore((s) => s.people);
export const useMyProfile = (): Profile | null => useAppStore((s) => s.profile);

export const usePerson = (personId: string): Person | undefined =>
  useAppStore((s) => s.people.find((p) => p.id === personId));

export const useVenue = (venueId: string | null | undefined): Venue | undefined =>
  useAppStore((s) => s.venues.find((v) => v.id === venueId));

export const useMyVenueId = (): string | null => useAppStore((s) => s.myVenueId);

export function useMyCheckin(): { venue: Venue | null; at: number | null } {
  const venues = useAppStore((s) => s.venues);
  const myVenueId = useAppStore((s) => s.myVenueId);
  const at = useAppStore((s) => s.myCheckedInAt);
  return { venue: venues.find((v) => v.id === myVenueId) ?? null, at };
}

export interface Match {
  person: Person;
  compat: Compat;
}

/** エリア内全員を総合スコア降順に並べた上位N人(既定3人) */
export function useMatches(limit = 3): Match[] {
  const profile = useAppStore((s) => s.profile);
  const people = useAppStore((s) => s.people);
  return useMemo(() => {
    if (!profile) return [];
    return people
      .map((person) => ({ person, compat: compat(profile, person) }))
      .sort((a, b) => b.compat.total - a.compat.total)
      .slice(0, limit);
  }, [profile, people, limit]);
}

export function useCompatWith(personId: string): Compat | null {
  const profile = useAppStore((s) => s.profile);
  const person = usePerson(personId);
  return useMemo(() => {
    if (!profile || !person) return null;
    return compat(profile, person);
  }, [profile, person]);
}

export function useChats(): { person: Person; last: ChatMessage }[] {
  const chats = useAppStore((s) => s.chats);
  const people = useAppStore((s) => s.people);
  return useMemo(
    () =>
      Object.entries(chats)
        .flatMap(([personId, msgs]) => {
          const person = people.find((p) => p.id === personId);
          const last = msgs[msgs.length - 1];
          return person && last ? [{ person, last }] : [];
        })
        .sort((a, b) => b.last.at - a.last.at),
    [chats, people],
  );
}

const EMPTY_MESSAGES: ChatMessage[] = [];
export const useChatMessages = (personId: string): ChatMessage[] =>
  useAppStore((s) => s.chats[personId] ?? EMPTY_MESSAGES);

export const useIsLiked = (personId: string): boolean =>
  useAppStore((s) => s.likedIds.includes(personId));

export const useDraft = () => useAppStore((s) => s.draft);

export const api = {
  setDraftAge: (v: AgeBand) => useAppStore.getState().setDraftAge(v),
  toggleDraftHobby: (v: Hobby) => useAppStore.getState().toggleDraftHobby(v),
  setDraftMbti: (v: MbtiType) => useAppStore.getState().setDraftMbti(v),
  completeProfile: () => useAppStore.getState().completeProfile(),
  checkIn: (venueId: string) => useAppStore.getState().checkIn(venueId),
  checkOut: () => useAppStore.getState().checkOut(),
  sendLike: (personId: string) => useAppStore.getState().sendLike(personId),
  sendMessage: (personId: string, text: string) => useAppStore.getState().sendMessage(personId, text),
};
