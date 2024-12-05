import * as nodeModule from "module";

/**
 * Checks if the provided module name is a Node.js built-in module.
 *
 * @param moduleName - The name of the module to check, e.g., "fs" or "http".
 * @returns True if the module is a Node.js built-in module, otherwise false.
 */
export function isNodeBuiltInModuleImport(moduleName: string): boolean {
  return nodeModule.builtinModules.includes(moduleName);
}
