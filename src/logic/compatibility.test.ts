import { describe, expect, it } from 'vitest';

import { baseScore, compat, hobbyBonus, rankOf, totalScore } from '@/logic/compatibility';
import type { Person, Profile } from '@/types';

const me: Profile = { ageBand: '30代', hobbies: ['映画', '旅行'], mbti: 'INFJ' };

function person(mbti: Person['mbti'], hobbies: Person['hobbies'] = []): Person {
  return { id: 'p', mbti, ageBand: '30代', hobbies, venueId: null, coord: { latitude: 0, longitude: 0 } };
}

describe('baseScore', () => {
  it('INFJ×ENFP は 96(N一致+24, E/I不一致+12, J/P不一致+6, F一致+4)', () => {
    expect(baseScore('INFJ', 'ENFP')).toBe(96);
  });
  it('INFJ×ISTJ は 38(N/S不一致-16, E/I一致+2, J/P一致+2)', () => {
    expect(baseScore('INFJ', 'ISTJ')).toBe(38);
  });
  it('INFJ×ESTP は 52(N/S不一致-16, E/I不一致+12, J/P不一致+6)', () => {
    expect(baseScore('INFJ', 'ESTP')).toBe(52);
  });
  it('INFJ×INTJ は 78(N一致+24, E/I一致+2, J/P一致+2)', () => {
    expect(baseScore('INFJ', 'INTJ')).toBe(78);
  });
  it('対称である', () => {
    expect(baseScore('ENFP', 'INFJ')).toBe(baseScore('INFJ', 'ENFP'));
  });
});

describe('rankOf', () => {
  it('85以上=S / 70-84=A / 50-69=B / 50未満=C', () => {
    expect(rankOf(96)).toBe('S');
    expect(rankOf(85)).toBe('S');
    expect(rankOf(84)).toBe('A');
    expect(rankOf(70)).toBe('A');
    expect(rankOf(69)).toBe('B');
    expect(rankOf(50)).toBe('B');
    expect(rankOf(49)).toBe('C');
  });
});

describe('hobbyBonus', () => {
  it('共通趣味1つにつき+3', () => {
    expect(hobbyBonus(['映画', '旅行'], ['映画', '旅行', '音楽'])).toBe(6);
  });
  it('上限は+9', () => {
    expect(hobbyBonus(['映画', '旅行', '音楽', '読書'], ['映画', '旅行', '音楽', '読書'])).toBe(9);
  });
  it('共通なしは0', () => {
    expect(hobbyBonus(['映画'], ['読書'])).toBe(0);
  });
});

describe('totalScore / compat', () => {
  it('total = base + bonus(100上限)', () => {
    // INFJ×ENFP base 96 + 共通2つ(+6) = 102 → 100
    expect(totalScore(me, person('ENFP', ['映画', '旅行', 'グルメ']))).toBe(100);
  });
  it('rank は base のみで決まる(bonus で境界を跨がない)', () => {
    // INFJ×INTJ base 78 = A。bonus +9 で 87 になっても A のまま
    const c = compat(me, person('INTJ', ['映画', '旅行', '読書']));
    expect(c.base).toBe(78);
    expect(c.total).toBe(84);
    expect(c.rank).toBe('A');
  });
});
