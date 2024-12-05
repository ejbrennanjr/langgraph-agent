// Combining multiple import styles
import DefaultClass, { 
  STRING_VALUE,
  helper as utilHelper,
  Utility,
} from './sourceValues';

import type { Status } from './sourceTypes';
import * as types from './sourceTypes';

export class Test extends DefaultClass {
  status: Status = 'active';
  
  helper() {
    utilHelper();
    Utility.help();
    return STRING_VALUE;
  }
}