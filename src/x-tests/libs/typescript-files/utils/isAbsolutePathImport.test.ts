import * as path from "path";
import { isAbsolutePathImport } from "@/libs/typescript-files/utils/isAbsolutePathImport";

describe("isAbsolutePathImport", () => {
  test("returns true for absolute path starting from root", () => {
    // Scenario: The import path is an absolute path from the root directory
    // Example: /src/utils/helper
    const importPath = "/src/utils/helper";
    const result = isAbsolutePathImport(importPath);

    // Expectation: The function should return true for an absolute path
    expect(result).toBe(true);
  });

  test("returns false for relative path starting with ./", () => {
    // Scenario: The import path is a relative path using ./ notation
    // Example: ./utils/helper
    const importPath = "./utils/helper";
    const result = isAbsolutePathImport(importPath);

    // Expectation: The function should return false for a relative path
    expect(result).toBe(false);
  });

  test("returns false for relative path starting with ../", () => {
    // Scenario: The import path is a relative path using ../ notation
    // Example: ../config/constants
    const importPath = "../config/constants";
    const result = isAbsolutePathImport(importPath);

    // Expectation: The function should return false for a relative path
    expect(result).toBe(false);
  });

  test("returns false for module imports like npm packages", () => {
    // Scenario: The import path is a third-party module like 'lodash'
    // Example: lodash
    const importPath = "lodash";
    const result = isAbsolutePathImport(importPath);

    // Expectation: The function should return false, as this is not an absolute path
    expect(result).toBe(false);
  });

  test("returns true for absolute path using path.resolve", () => {
    // Scenario: The import path is generated using path.resolve, simulating an absolute path.
    // Example: path.resolve("/src/utils/helper") produces an absolute path
    const importPath = path.resolve("/src/utils/helper");
    const result = isAbsolutePathImport(importPath);

    // Expectation: The function should return true for this absolute path
    expect(result).toBe(true);
  });
});
