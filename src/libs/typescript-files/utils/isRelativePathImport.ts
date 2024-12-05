/**
 * Checks if the provided module path is a relative path (e.g., "./utils" or "../components").
 *
 * @param modulePath - The import path string to check.
 * @returns True if the module path is relative, false otherwise.
 *
 * Example:
 *   isRelativePathImport("./utils/helper"); // true
 *   isRelativePathImport("lodash"); // false
 */
export function isRelativePathImport(modulePath: string): boolean {
  return modulePath.startsWith("./") || modulePath.startsWith("../");
}
