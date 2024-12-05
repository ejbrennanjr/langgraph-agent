import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates module fixtures demonstrating all import pattern variations.
 * Each file focuses on testing specific import scenarios to ensure proper graph generation.
 */
export async function generateImportPatterns(): Promise<Fixture[]> {
  return [
    // Source modules that will be imported from
    {
      filename: "sourceValues.ts",
      content: `
        export const STRING_VALUE = 'test';
        export const NUMBER_VALUE = 42;
        export function helper() { return true; }
        export class Utility { 
          static help() { return true; }
        }
        
        export default class DefaultClass {
          method() { return true; }
        }
      `,
    },
    {
      filename: "sourceTypes.ts",
      content: `
        export interface UserInterface {
          id: string;
          name: string;
        }
        
        export type Status = 'active' | 'inactive';
        
        export default interface DefaultInterface {
          config: string;
        }
      `,
    },
    // Named Imports
    {
      filename: "namedImports.ts",
      content: `
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
      `,
    },
    // Default Imports
    {
      filename: "defaultImports.ts",
      content: `
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
      `,
    },
    // Namespace Imports
    {
      filename: "namespaceImports.ts",
      content: `
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
      `,
    },
    {
      filename: "namedOnlyImports.ts",
      content: `
        // Named-only import
        import { NamedImport } from './sourceValues';
      `,
    },
    // Mixed Import Styles
    {
      filename: "mixedImports.ts",
      content: `
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
      `,
    },
    // External Package Imports
    {
      filename: "externalImports.ts",
      content: `
        // Default external import
        import React from 'react';
        
        // Named external imports
        import { useState, useEffect } from 'react';
        
        // External type imports
        import type { ReactNode } from 'react';
        
        // Namespace external import
        import * as ReactDOM from 'react-dom';
        
        // Mixed external imports
        import axios, { AxiosResponse } from 'axios';
        
        export function Component({ children }: { children: ReactNode }) {
          const [state, setState] = useState(false);
          
          useEffect(() => {
            axios.get('/api').then((response: AxiosResponse) => {
              setState(true);
            });
          }, []);
          
          return React.createElement('div', {}, children);
        }
      `,
    },
  ];
}
