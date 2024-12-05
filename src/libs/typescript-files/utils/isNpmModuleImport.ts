import * as fs from "fs";
import * as path from "path";

/**
 * Checks if the provided module path points to an external NPM package in node_modules.
 *
 * @param modulePath - The import path to check.
 * @param nodeModulesPath - The path to the node_modules directory (typically from getNodeModulePath()).
 * @returns True if the module path resolves to an NPM package, false otherwise.
 *
 * Example:
 *   const nodeModulesPath = getNodeModulePath();
 *   isNpmModuleImport("lodash", nodeModulesPath); // true if lodash is installed
 */
export function isNpmModuleImport(
  modulePath: string,
  nodeModulesPath: string
): boolean {
  if (!nodeModulesPath) return false; // node_modules not found, so it can't be an NPM module

  const resolvedModulePath = path.join(nodeModulesPath, modulePath);
  return fs.existsSync(resolvedModulePath);
}
