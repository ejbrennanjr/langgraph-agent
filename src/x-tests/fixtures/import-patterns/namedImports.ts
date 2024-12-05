// Basic named imports
import { STRING_VALUE, NUMBER_VALUE } from './sourceValues';

// Aliased named imports
import { helper as utilHelper, Utility as UtilityClass } from './sourceValues';

// Type named imports
import { UserInterface, Status } from './sourceTypes';

// Type-only named imports
import type { UserInterface as User } from './sourceTypes';

export function test() {
  utilHelper();
  return STRING_VALUE + NUMBER_VALUE;
}