import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates additional test case fixtures for edge cases in export mapping.
 */
export async function generateExportEdgeCaseModules(): Promise<Fixture[]> {
  return [
    {
      filename: "emptyFile.ts",
      content: `
        // No exports or declarations
      `,
    },
    {
      filename: "malformedExports.ts",
      content: `
        export const validExport = 42;
        export { nonExistentSymbol }; // Reference to a non-existent declaration
      `,
    },
    {
      filename: "codeWithoutExports.ts",
      content: `
        const internalValue = 42;
        function internalFunction() {
          return internalValue;
        }
        // No exports from this file
      `,
    },
    {
      filename: "directAliasExports.ts",
      content: `
        // Direct alias exports
        const originalValue = 42;
        const anotherValue = "hello";

        export { originalValue as aliasedValue, anotherValue as renamedValue };
      `,
    },
    {
      filename: "emptyNamedExports.ts",
      content: `
        export {};
      `,
    },
  ];
}
