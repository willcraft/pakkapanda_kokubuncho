import type { Hobby, MbtiType, Person, Profile, Rank } from '@/types';

// 仕様書 4.4: MBTI 4軸から決定的にスコアを算出するモック用ヒューリスティック
export function baseScore(a: MbtiType, b: MbtiType): number {
  let score = 50;
  score += a[1] === b[1] ? 24 : -16; // N/S: 価値観の土台
  score += a[0] !== b[0] ? 12 : 2; // E/I: エネルギーの補完
  score += a[3] !== b[3] ? 6 : 2; // J/P: 生活リズムの補完
  score += a[2] === b[2] ? 4 : 0; // T/F: 判断基準の近さ
  return score;
}

export function rankOf(base: number): Rank {
  if (base >= 85) return 'S';
  if (base >= 70) return 'A';
  if (base >= 50) return 'B';
  return 'C';
}

export function hobbyBonus(a: Hobby[], b: Hobby[]): number {
  const common = a.filter((h) => b.includes(h)).length;
  return Math.min(common * 3, 9);
}

export function totalScore(me: Profile, p: Person): number {
  return Math.min(100, baseScore(me.mbti, p.mbti) + hobbyBonus(me.hobbies, p.hobbies));
}

export interface Compat {
  base: number;
  total: number;
  rank: Rank;
}

export function compat(me: Profile, p: Person): Compat {
  const base = baseScore(me.mbti, p.mbti);
  return { base, total: totalScore(me, p), rank: rankOf(base) };
}
