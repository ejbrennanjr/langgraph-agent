import * as fs from "fs";
import * as path from "path";

/**
 * Loads and parses tsconfig.json from a specified directory.
 *
 * @param basePath - The directory path to look for tsconfig.json.
 * @returns The parsed tsconfig.json content or null if it doesn't exist.
 */
export function loadTsConfig(basePath: string): Record<string, any> | null {
  const configPath = path.join(basePath, "tsconfig.json");

  // Check if tsconfig.json exists in the specified directory
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configContent);
  } catch (error) {
    throw new SyntaxError("Invalid JSON in tsconfig.json");
  }
}
