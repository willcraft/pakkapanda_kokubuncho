export const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
] as const;
export type MbtiType = (typeof MBTI_TYPES)[number];

export const AGE_BANDS = ['20代前半', '20代後半', '30代', '40代', '50代以上'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const HOBBIES = [
  '映画', '音楽', 'カフェ巡り', 'スポーツ観戦', '旅行',
  'ゲーム', 'アウトドア', '読書', 'グルメ', 'アート',
] as const;
export type Hobby = (typeof HOBBIES)[number];

export type Rank = 'S' | 'A' | 'B' | 'C';

export const RANK_LABELS: Record<Rank, string> = {
  S: '運命級',
  A: '好相性',
  B: '普通',
  C: '微妙',
};

export interface Profile {
  ageBand: AgeBand;
  hobbies: Hobby[];
  mbti: MbtiType;
}

export interface Coord {
  latitude: number;
  longitude: number;
}

export interface Person {
  id: string;
  mbti: MbtiType;
  ageBand: AgeBand;
  hobbies: Hobby[];
  venueId: string | null;
  checkedInAt?: number;
  coord: Coord;
}

export type VenueCategory = 'バー' | '居酒屋' | 'カフェ' | 'ラウンジ';

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  coord: Coord;
  distanceM: number;
}

export interface ChatMessage {
  id: string;
  personId: string;
  from: 'me' | 'them' | 'system';
  text: string;
  at: number;
}
