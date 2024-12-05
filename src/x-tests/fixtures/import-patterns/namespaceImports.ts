// Basic namespace import
import * as values from './sourceValues';

// Namespace with named imports
import * as types from './sourceTypes';
import { UserInterface } from './sourceTypes';

// Namespace with default import
import DefaultClass, * as utils from './sourceValues';

export function test() {
  values.helper();
  utils.STRING_VALUE;
  const user: types.UserInterface = { id: '1', name: 'test' };
}