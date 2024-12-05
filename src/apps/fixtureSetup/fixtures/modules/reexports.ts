import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates module fixtures demonstrating various re-export patterns.
 * Focuses specifically on testing different types of export and re-export syntax.
 */
export async function generateReExportModules(): Promise<Fixture[]> {
  return [
    {
      filename: "values.ts",
      content: `
        export const STRING_VALUE = 'test';
        export const NUMBER_VALUE = 42;
        export const BOOLEAN_VALUE = true;

        export function helper() {
          return STRING_VALUE;
        }
      `,
    },
    {
      filename: "types.ts",
      content: `
        export interface Config {
          enabled: boolean;
          name: string;
        }

        export type Status = 'pending' | 'complete';
        
        export default interface DefaultConfig {
          timeout: number;
        }
      `,
    },
    {
      filename: "namedReExports.ts",
      content: `
        // Named re-exports with and without aliases
        export { STRING_VALUE, NUMBER_VALUE as count } from './values';
        export { Config, type Status as TaskStatus } from './types';
        export { helper as utilHelper } from './values';
      `,
    },
    {
      filename: "defaultReExports.ts",
      content: `
        // Re-exporting a default export
        export { default } from './types';
        export { default as Config } from './types';
      `,
    },
    {
      filename: "wildcardReExports.ts",
      content: `
        // Wildcard re-exports
        export * from './values';
        export * as types from './types';
      `,
    },
    {
      filename: "mixedReExports.ts",
      content: `
        // Combining different re-export styles
        export * from './values';
        export { type Config } from './types';
        export { default as TypesConfig } from './types';
        export { helper } from './values';
      `,
    },
    {
      filename: "aggregateIndex.ts",
      content: `
        // Common index file pattern combining re-exports
        export * from './values';
        export * from './types';
        export { helper as globalHelper } from './values';
        export { default as GlobalConfig } from './types';
      `,
    },
  ];
}
