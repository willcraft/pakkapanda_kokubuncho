import { describe, expect, it } from 'vitest';

import { venueCompatPct, venueMbtiCharacter, venueMembers } from '@/logic/venueStats';
import type { Person, Profile } from '@/types';

const me: Profile = { ageBand: '30代', hobbies: ['映画'], mbti: 'INFJ' };

function person(id: string, mbti: Person['mbti'], venueId: string | null, checkedInAt?: number): Person {
  return { id, mbti, ageBand: '20代前半', hobbies: [], venueId, checkedInAt, coord: { latitude: 0, longitude: 0 } };
}

describe('venueMembers', () => {
  it('該当店舗の人だけをチェックイン時刻の古い順で返す', () => {
    const people = [
      person('a', 'ENFP', 'v1', 200),
      person('b', 'INTJ', 'v2', 100),
      person('c', 'ISFP', 'v1', 100),
      person('d', 'ESTP', null),
    ];
    expect(venueMembers(people, 'v1').map((p) => p.id)).toEqual(['c', 'a']);
  });
});

describe('venueCompatPct', () => {
  it('0人なら null', () => {
    expect(venueCompatPct(me, [])).toBeNull();
  });
  it('メンバーとの総合スコア平均を四捨五入', () => {
    // INFJ×ENFP total 96 / INFJ×ISTJ total 38 → 平均 67
    const members = [person('a', 'ENFP', 'v1'), person('b', 'ISTJ', 'v1')];
    expect(venueCompatPct(me, members)).toBe(67);
  });
});

describe('venueMbtiCharacter', () => {
  it('0人なら null', () => {
    expect(venueMbtiCharacter([])).toBeNull();
  });
  it('最頻タイプを返す', () => {
    const members = [person('a', 'ENFP', 'v1'), person('b', 'ENFP', 'v1'), person('c', 'INTJ', 'v1')];
    expect(venueMbtiCharacter(members)).toBe('ENFP');
  });
  it('同数はタイプ名昇順で先勝ち', () => {
    const members = [person('a', 'INTJ', 'v1'), person('b', 'ENFP', 'v1')];
    expect(venueMbtiCharacter(members)).toBe('ENFP');
  });
});
