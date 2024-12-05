import { isAliasPathImport } from "@/libs/typescript-files/utils/isAliasPathImport";

describe("isAliasPathImport", () => {
  const aliasConfig = {
    "@/components/*": ["src/components/*"],
    "@/utils/*": ["src/utils/*"],
    "shared/*": ["src/shared/*"],
  };
  const baseUrl = "/Users/project";

  test("returns true for a recognized alias path", () => {
    // Scenario: The import path matches an alias defined in the paths config
    // Example: "@/components/Button"
    const importPath = "@/components/Button";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return true for recognized alias path
    expect(result).toBe(true);
  });

  test("returns false for a path that doesn’t match any alias", () => {
    // Scenario: The import path does not match any alias in the config
    // Example: "@/nonexistent/Helper"
    const importPath = "@/nonexistent/Helper";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return false since the path doesn't match an alias
    expect(result).toBe(false);
  });

  test("returns false for relative paths", () => {
    // Scenario: Relative paths should not match aliases in the config
    // Example: "./utils/helper"
    const importPath = "./utils/helper";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return false for relative paths
    expect(result).toBe(false);
  });

  test("returns false for absolute paths", () => {
    // Scenario: Absolute paths from the root should not match aliases
    // Example: "/src/utils/helper"
    const importPath = "/src/utils/helper";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return false for absolute paths
    expect(result).toBe(false);
  });

  test("returns true for another recognized alias path", () => {
    // Scenario: A path matches a different alias in the config
    // Example: "@/utils/Logger"
    const importPath = "@/utils/Logger";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return true for this alias
    expect(result).toBe(true);
  });

  test("returns true for shared alias path", () => {
    // Scenario: A path matches a generic "shared" alias pattern
    // Example: "shared/Modal"
    const importPath = "shared/Modal";
    const result = isAliasPathImport(importPath, aliasConfig, baseUrl);

    // Expectation: The function should return true for the shared alias path
    expect(result).toBe(true);
  });
});
