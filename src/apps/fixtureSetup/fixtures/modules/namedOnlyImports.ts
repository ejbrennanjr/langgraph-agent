import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates module fixtures for scenarios with named-only imports.
 */
export async function generateNamedOnlyImportsModules(): Promise<Fixture[]> {
  return [
    {
      filename: "namedOnlyImports.ts",
      content: `
        // Named-only import
        import { NamedImport } from './sourceValues';
      `,
    },
  ];
}
