import type { Person, Venue } from '@/types';

// 国分町エリア中心(仙台市青葉区国分町)
export const KOKUBUNCHO_CENTER = { latitude: 38.261, longitude: 140.8722 };
export const AREA_RADIUS_M = 250;

export const VENUES: Venue[] = [
  {
    id: 'v-cielo',
    name: 'BAR CIELO',
    category: 'バー',
    coord: { latitude: 38.2607, longitude: 140.8719 },
    distanceM: 120,
  },
  {
    id: 'v-ichigo',
    name: '炉ばた 一期',
    category: '居酒屋',
    coord: { latitude: 38.2617, longitude: 140.8727 },
    distanceM: 210,
  },
  {
    id: 'v-noir',
    name: 'Lounge NOIR',
    category: 'ラウンジ',
    coord: { latitude: 38.2614, longitude: 140.8713 },
    distanceM: 180,
  },
  {
    id: 'v-luna',
    name: 'Cafe Luna',
    category: 'カフェ',
    coord: { latitude: 38.2602, longitude: 140.8729 },
    distanceM: 160,
  },
  {
    id: 'v-hachi',
    name: '立ち呑み ハチ',
    category: '居酒屋',
    coord: { latitude: 38.2621, longitude: 140.8718 },
    distanceM: 260,
  },
];

const now = Date.now();
const minAgo = (n: number) => now - n * 60_000;

export const PEOPLE: Person[] = [
  // BAR CIELO(6人)
  {
    id: 'p1',
    mbti: 'ENFP',
    ageBand: '30代',
    hobbies: ['映画', '旅行', 'グルメ'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(15),
    coord: { latitude: 38.2608, longitude: 140.872 },
  },
  {
    id: 'p2',
    mbti: 'ISFP',
    ageBand: '20代前半',
    hobbies: ['カフェ巡り', '音楽'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(8),
    coord: { latitude: 38.2606, longitude: 140.8718 },
  },
  {
    id: 'p3',
    mbti: 'ENTP',
    ageBand: '20代後半',
    hobbies: ['ゲーム', 'スポーツ観戦'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(42),
    coord: { latitude: 38.2607, longitude: 140.8717 },
  },
  {
    id: 'p4',
    mbti: 'ESFJ',
    ageBand: '30代',
    hobbies: ['グルメ', '旅行'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(25),
    coord: { latitude: 38.2608, longitude: 140.8718 },
  },
  {
    id: 'p5',
    mbti: 'ENFP',
    ageBand: '20代後半',
    hobbies: ['音楽', 'アウトドア'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(55),
    coord: { latitude: 38.2606, longitude: 140.872 },
  },
  {
    id: 'p6',
    mbti: 'ISTP',
    ageBand: '40代',
    hobbies: ['読書', 'ゲーム'],
    venueId: 'v-cielo',
    checkedInAt: minAgo(70),
    coord: { latitude: 38.2607, longitude: 140.8721 },
  },
  // Lounge NOIR(3人)
  {
    id: 'p7',
    mbti: 'INTJ',
    ageBand: '20代後半',
    hobbies: ['アート', '読書'],
    venueId: 'v-noir',
    checkedInAt: minAgo(32),
    coord: { latitude: 38.2614, longitude: 140.8714 },
  },
  {
    id: 'p8',
    mbti: 'INFP',
    ageBand: '30代',
    hobbies: ['映画', 'アート'],
    venueId: 'v-noir',
    checkedInAt: minAgo(12),
    coord: { latitude: 38.2615, longitude: 140.8712 },
  },
  {
    id: 'p9',
    mbti: 'ESTJ',
    ageBand: '40代',
    hobbies: ['スポーツ観戦', 'グルメ'],
    venueId: 'v-noir',
    checkedInAt: minAgo(48),
    coord: { latitude: 38.2613, longitude: 140.8713 },
  },
  // 街歩き中(3人)
  {
    id: 'p10',
    mbti: 'ENFJ',
    ageBand: '20代前半',
    hobbies: ['カフェ巡り', '旅行', '映画'],
    venueId: null,
    coord: { latitude: 38.2612, longitude: 140.8725 },
  },
  {
    id: 'p11',
    mbti: 'ISTJ',
    ageBand: '50代以上',
    hobbies: ['読書', 'グルメ'],
    venueId: null,
    coord: { latitude: 38.2604, longitude: 140.8714 },
  },
  {
    id: 'p12',
    mbti: 'ESFP',
    ageBand: '20代後半',
    hobbies: ['音楽', 'スポーツ観戦'],
    venueId: null,
    coord: { latitude: 38.2618, longitude: 140.8722 },
  },
];
