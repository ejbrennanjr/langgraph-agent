import { ImportPathType } from "@/libs/typescript-files/domain/ImportPathType";

// Node.js built-in modules list - you might want to put this in a separate constants file
const NODE_BUILT_INS = new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  "punycode",
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib",
]);

/**
 * Determines the type of the import path based on its pattern.
 * Makes determination based on syntactic structure rather than
 * filesystem resolution.
 *
 * @param moduleSpecifier - The import path to classify
 * @returns The ImportPathType enum value representing the type of import
 */
export function getImportPathType(moduleSpecifier: string): ImportPathType {
  if (!moduleSpecifier) {
    throw new Error("Module specifier cannot be empty");
  }

  // Handle relative paths (./ or ../ or .)
  if (
    moduleSpecifier.startsWith("./") ||
    moduleSpecifier.startsWith("../") ||
    moduleSpecifier === "."
  ) {
    return ImportPathType.RelativePath;
  }

  // Handle absolute paths (starts with / or contains drive letter for Windows)
  if (moduleSpecifier.startsWith("/") || /^[a-zA-Z]:\\/.test(moduleSpecifier)) {
    return ImportPathType.AbsolutePath;
  }

  // Handle alias paths (starts with @/)
  if (moduleSpecifier.startsWith("@/")) {
    return ImportPathType.AliasPath;
  }

  // Handle Node.js built-in modules
  if (
    moduleSpecifier.startsWith("node:") ||
    NODE_BUILT_INS.has(moduleSpecifier)
  ) {
    return ImportPathType.NodeBuiltInModule;
  }

  // Handle NPM modules - includes bare packages, scoped packages, and their subpaths
  // Examples: 'react', '@types/node', 'lodash/fp', '@angular/core/testing'
  const npmPattern =
    /^(?:@[a-zA-Z0-9-]+\/)?[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-_./]+)?$/;
  if (npmPattern.test(moduleSpecifier)) {
    return ImportPathType.NpmModule;
  }

  throw new Error(
    `Unrecognized import type for module specifier: ${moduleSpecifier}`
  );
}
