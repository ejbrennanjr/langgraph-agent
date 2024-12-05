// src/apps/fixturesSetup/utils/writeFixtures.ts
import { promises as fs } from "fs";
import path from "path";
import { Fixture } from "../types/Fixture";

// --------------------------------------------------------------------------------------------------------------------------
// Exported Functions
// --------------------------------------------------------------------------------------------------------------------------

/**
 * Writes an array of fixtures to a target directory.
 * Ensures the content is properly dedented before writing.
 *
 * @param fixtures - The fixtures to write
 * @param targetDir - The directory to write the fixtures into
 */
export async function writeFixtures(
  fixtures: Fixture[],
  targetDir: string
): Promise<void> {
  // Ensure the target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  for (const fixture of fixtures) {
    const filePath = path.join(targetDir, fixture.filename);
    const fileDir = path.dirname(filePath);

    // Create all parent directories for this file
    await fs.mkdir(fileDir, { recursive: true });

    // Normalize content indentation
    const normalizedContent = dedent(fixture.content);

    await fs.writeFile(filePath, normalizedContent, "utf8");
    console.log(`Wrote fixture: ${filePath}`);
  }
}

// --------------------------------------------------------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------------------------------------------------------

/**
 * Normalizes the indentation of the fixture content.
 * Ensures consistent formatting by dedenting all lines.
 *
 * @param content - The raw fixture content
 * @returns The dedented fixture content
 */
function dedent(content: string): string {
  const lines = content.split("\n");
  const minIndent = Math.min(
    ...lines
      .filter((line) => line.trim().length > 0) // Ignore empty lines
      .map((line) => line.match(/^(\s*)/)?.[0]?.length ?? 0) // Get leading whitespace count
  );

  return lines
    .map((line) => (line.startsWith(" ") ? line.slice(minIndent) : line))
    .join("\n")
    .trim();
}
