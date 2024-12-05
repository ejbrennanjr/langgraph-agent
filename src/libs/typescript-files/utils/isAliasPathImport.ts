/**
 * Determines if a given moduleSpecifier matches an alias defined in the aliasConfig.
 * This version focuses solely on pattern matching, without checking the filesystem.
 *
 * @param moduleSpecifier - The import path to check, e.g., "@/components/Button".
 * @param aliasConfig - The alias configuration object from tsconfig.json paths, e.g., { "@/components/*": ["src/components/*"] }.
 * @param baseUrl - The base directory for resolving aliases, typically the project root or tsconfig's baseUrl.
 * @returns True if the moduleSpecifier matches an alias pattern, otherwise false.
 */
export function isAliasPathImport(
  moduleSpecifier: string,
  aliasConfig: { [alias: string]: string[] },
  baseUrl: string
): boolean {
  // Iterate over each alias pattern in the alias configuration
  for (const aliasPattern in aliasConfig) {
    // Check if the moduleSpecifier starts with the aliasPattern (ignoring the wildcard)
    const baseAlias = aliasPattern.replace("/*", "");
    if (moduleSpecifier.startsWith(baseAlias)) {
      return true; // Alias match found
    }
  }

  // No matching alias pattern found
  return false;
}
