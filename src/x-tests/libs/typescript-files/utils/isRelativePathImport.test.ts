import { isRelativePathImport } from "@/libs/typescript-files/utils/isRelativePathImport";

describe("isRelativePathImport", () => {
  test("returns true for a relative path starting with ./", () => {
    // Scenario: The import path is a relative path using ./ notation
    // Example: "./utils/helper"
    const importPath = "./utils/helper";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return true for a relative path
    expect(result).toBe(true);
  });

  test("returns true for a relative path starting with ../", () => {
    // Scenario: The import path is a relative path using ../ notation
    // Example: "../config/constants"
    const importPath = "../config/constants";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return true for a relative path
    expect(result).toBe(true);
  });

  test("returns false for an absolute path starting with /", () => {
    // Scenario: The import path is an absolute path from the root directory
    // Example: "/src/utils/helper"
    const importPath = "/src/utils/helper";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return false for an absolute path
    expect(result).toBe(false);
  });

  test("returns false for an NPM module import", () => {
    // Scenario: The import path is an external NPM module
    // Example: "lodash"
    const importPath = "lodash";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return false for an NPM module import
    expect(result).toBe(false);
  });

  test("returns false for an alias path", () => {
    // Scenario: The import path uses an alias defined in tsconfig.json
    // Example: "@/components/Button"
    const importPath = "@/components/Button";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return false for an alias path
    expect(result).toBe(false);
  });

  test("returns false for an empty string", () => {
    // Scenario: The import path is an empty string, which is not a valid path
    // Example: ""
    const importPath = "";
    const result = isRelativePathImport(importPath);

    // Expectation: The function should return false for an empty string
    expect(result).toBe(false);
  });
});
