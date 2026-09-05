// バックエンド(docs/バックエンド仕様書.md §5)のレスポンス型
import type { AgeBand, Hobby, MbtiType, Rank, VenueCategory } from '@/types';

export interface ApiCompat {
  total: number;
  rank: Rank;
}

export interface ApiVenue {
  id: string;
  name: string;
  category: VenueCategory;
  lat: number;
  lng: number;
  distanceM: number | null;
  memberCount: number;
  mbtiCharacter: MbtiType | null;
  compatPct: number | null;
}

export interface ApiVenueMember {
  userId: string;
  mbti: MbtiType;
  ageBand: AgeBand;
  hobbies: Hobby[];
  checkedInAt: number | null;
  compat: ApiCompat;
}

export interface ApiVenueDetail extends ApiVenue {
  members: ApiVenueMember[];
}

export interface ApiPerson {
  userId: string;
  mbti: MbtiType;
  ageBand: AgeBand;
  hobbies: Hobby[];
  lat: number | null;
  lng: number | null;
  venueId: string | null;
  compat: ApiCompat;
  liked: boolean;
  likedMe: boolean;
}

/** 自分にいいねをくれた未対応の相手(GET /likes/received) */
export interface ApiReceivedLike {
  userId: string;
  mbti: MbtiType;
  ageBand: AgeBand;
  hobbies: Hobby[];
  compat: ApiCompat;
}

export type MessageKind = 'text' | 'like';

export interface ApiChatRow {
  peer: { userId: string; mbti: MbtiType; ageBand: AgeBand };
  matched: boolean;
  lastMessage: {
    id: string;
    text: string;
    from: 'me' | 'them';
    kind: MessageKind;
    createdAt: number;
  } | null;
}

export interface ApiMessage {
  id: string;
  text: string;
  from: 'me' | 'them';
  kind: MessageKind;
  createdAt: number;
}

export interface ApiMyCheckin {
  venueId: string;
  checkedInAt: number;
}
