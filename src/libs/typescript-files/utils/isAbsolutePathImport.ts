import * as path from "path";

/**
 * Checks if the provided module path is an absolute import path.
 * This would exclude paths that are relative (./ or ../) or node_modules.
 *
 * @param modulePath - The import path to check.
 * @returns True if the module path is absolute, false otherwise.
 *
 * Example:
 *   isAbsolutePathImport("/src/utils/helper"); // true
 *   isAbsolutePathImport("lodash"); // false
 */
export function isAbsolutePathImport(importPath: string): boolean {
  return path.isAbsolute(importPath);
}
