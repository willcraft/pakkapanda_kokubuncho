import { totalScore, type CompatProfile } from './compatibility';
import type { MbtiType } from './types';

export function venueCompatPct(me: CompatProfile, members: CompatProfile[]): number | null {
  if (members.length === 0) return null;
  const sum = members.reduce((acc, p) => acc + totalScore(me, p), 0);
  return Math.round(sum / members.length);
}

export function venueMbtiCharacter(members: { mbti: MbtiType }[]): MbtiType | null {
  if (members.length === 0) return null;
  const counts = new Map<MbtiType, number>();
  for (const p of members) counts.set(p.mbti, (counts.get(p.mbti) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}
