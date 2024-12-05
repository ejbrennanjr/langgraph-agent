// Basic default import
import DefaultClass from './sourceValues';

// Default with named imports
import DefaultInterface, { UserInterface } from './sourceTypes';

// Type-only default import
import type DefaultType from './sourceTypes';

export class TestClass extends DefaultClass {
  test(): UserInterface {
    return { id: '1', name: 'test' };
  }
}