import type { MbtiType, Rank } from '@/types';

export const colors = {
  bg: '#0B0E14',
  card: '#161B26',
  cardBorder: '#232B3A',
  text: '#F1F5F9',
  textDim: '#94A3B8',
  coral: '#F87171',
  coralDark: '#3A1B22',
  teal: '#2DD4BF',
  tealDark: '#0E2E30',
  yellow: '#FACC15',
  gray: '#64748B',
};

// MBTI 4グループ色分け: アナリスト(NT) / 外交官(NF) / 番人(SJ) / 探検家(SP)
const GROUP_COLORS = {
  NT: '#0F766E', // ティール系
  NF: '#8C3B44', // レッドブラウン
  SJ: '#274F8C', // ブルー
  SP: '#6D5BA6', // パープル
};

export function mbtiColor(t: MbtiType): string {
  const intuitive = t[1] === 'N';
  const thinking = t[2] === 'T';
  if (intuitive) return thinking ? GROUP_COLORS.NT : GROUP_COLORS.NF;
  // 感覚型は J/P で番人・探検家に分かれる
  return t[3] === 'J' ? GROUP_COLORS.SJ : GROUP_COLORS.SP;
}

export function rankColor(r: Rank): string {
  switch (r) {
    case 'S':
      return colors.coral;
    case 'A':
      return colors.teal;
    case 'B':
      return colors.yellow;
    case 'C':
      return colors.gray;
  }
}
