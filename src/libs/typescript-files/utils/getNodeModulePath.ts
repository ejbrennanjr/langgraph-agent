import * as fs from "fs";
import * as path from "path";

/**
 * Finds the closest node_modules directory starting from the specified directory.
 *
 * @param startDir - Directory to start searching from (defaults to process.cwd()).
 * @returns The absolute path to the node_modules directory if found, otherwise null.
 *
 * Example usage:
 *   const nodeModulesPath = getNodeModulePath("/Users/project/src");
 *   // "/Users/project/node_modules" if found
 */
export function getNodeModulePath(
  startDir: string = process.cwd()
): string | null {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const nodeModulesPath = path.join(currentDir, "node_modules");
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return null; // node_modules not found in the directory tree
}
