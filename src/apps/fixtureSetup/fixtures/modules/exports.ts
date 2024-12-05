import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates test case fixtures for named and alias named exports.
 */
export async function generateNamedExportsModules(): Promise<Fixture[]> {
  return [
    {
      filename: "namedExports.ts",
      content: `
        const Logger = { log: (msg: string) => console.log(msg) };
        export { Logger };
      `,
    },
    {
      filename: "aliasNamedExports.ts",
      content: `
        const Logger = { log: (msg: string) => console.log(msg) };
        export { Logger as AppLogger };
      `,
    },
  ];
}
