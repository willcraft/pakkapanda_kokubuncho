import type { Person } from '@/types';

export { venueCompatPct, venueMbtiCharacter } from '../../shared/venueStats';

export function venueMembers(people: Person[], venueId: string): Person[] {
  return people
    .filter((p) => p.venueId === venueId)
    .sort((a, b) => (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0));
}
