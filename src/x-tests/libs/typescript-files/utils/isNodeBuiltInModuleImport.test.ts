import { isNodeBuiltInModuleImport } from "@/libs/typescript-files/utils/isNodeBuiltInModuleImport";

describe("isNodeBuiltInModuleImport", () => {
  test("returns true for Node.js built-in module 'fs'", () => {
    // Scenario: The module path is a Node.js built-in module
    // Example: "fs"
    const modulePath = "fs";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return true for a built-in module
    expect(result).toBe(true);
  });

  test("returns true for Node.js built-in module 'path'", () => {
    // Scenario: The module path is a Node.js built-in module
    // Example: "path"
    const modulePath = "path";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return true for a built-in module
    expect(result).toBe(true);
  });

  test("returns true for Node.js built-in module 'http'", () => {
    // Scenario: The module path is a Node.js built-in module
    // Example: "http"
    const modulePath = "http";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return true for a built-in module
    expect(result).toBe(true);
  });

  test("returns false for non-built-in module 'lodash'", () => {
    // Scenario: The module path is an NPM package, not a Node.js built-in module
    // Example: "lodash"
    const modulePath = "lodash";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return false for a non-built-in module
    expect(result).toBe(false);
  });

  test("returns false for relative path './utils/helper'", () => {
    // Scenario: The module path is a relative path within the project
    // Example: "./utils/helper"
    const modulePath = "./utils/helper";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return false for relative paths
    expect(result).toBe(false);
  });

  test("returns false for module with similar name 'filesystem'", () => {
    // Scenario: The module path resembles a built-in module but is not actually one
    // Example: "filesystem"
    const modulePath = "filesystem";
    const result = isNodeBuiltInModuleImport(modulePath);

    // Expectation: The function should return false since "filesystem" is not a built-in module
    expect(result).toBe(false);
  });
});
