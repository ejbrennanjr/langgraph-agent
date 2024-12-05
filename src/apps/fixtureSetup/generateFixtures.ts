// src/apps/fixturesSetup/generateFixtureOutputs.ts
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs/promises";

// Define the path for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { writeFixtures } from "@/apps/fixtureSetup/utils/writeFixtures";
import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

// --------------------------------------------------------------------------------------------------------------------------
// Exported Functions
// --------------------------------------------------------------------------------------------------------------------------

/**
 * Writes all fixtures to `src/x-tests/fixtures`.
 *
 * @param allFixtures - An object containing arrays of fixtures by category (e.g., modules, classes, etc.)
 */
export async function generateFixtureOutputs(
  allFixtures: Record<string, Fixture[]>
): Promise<void> {
  const baseDir = path.resolve(__dirname, "../../x-tests/fixtures"); // Update path to reflect the new directory structure
  await cleanDirectory(baseDir);
  for (const [key, fixtures] of Object.entries(allFixtures)) {
    console.log(`Writing ${key} fixtures to ${baseDir}/${key}...`);
    await writeFixtures(fixtures, `${baseDir}/${key}`);
  }
  // Generate a fixture-specific tsconfig.json
  console.log("Generating fixture-specific tsconfig.json...");
  await generateFixtureTsConfig(baseDir);

  console.log("Fixture outputs generated successfully!");

  // --------------------------------------------------------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------------------------------------------------------

  async function cleanDirectory(dir: string): Promise<void> {
    console.log(`Cleaning directory: ${dir}`);
    await fs.rm(dir, { recursive: true, force: true });
  }

  /**
   * Generates a tsconfig.json for the fixtures directory.
   */
  async function generateFixtureTsConfig(outputPath: string): Promise<void> {
    const tsConfig = {
      compilerOptions: {
        target: "ESNext",
        module: "CommonJS",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        baseUrl: ".", // Required for path alias resolution
        paths: {
          "@/*": ["*"], // Example alias for testing
        },
      },
      include: ["**/*.ts"], // Include all .ts files in the fixture folder
      exclude: ["node_modules", "dist"], // Standard exclusions
    };

    const tsConfigPath = path.join(outputPath, "tsconfig.json");
    await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log(`Fixture-specific tsconfig.json generated at: ${tsConfigPath}`);
  }
}
