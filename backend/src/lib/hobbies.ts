import type { Hobby } from '../../../shared/types';
import { HOBBIES } from '../../../shared/types';

export function sortHobbiesCanonical(hobbies: string[]): Hobby[] {
  return (hobbies as Hobby[]).slice().sort((a, b) => HOBBIES.indexOf(a) - HOBBIES.indexOf(b));
}
