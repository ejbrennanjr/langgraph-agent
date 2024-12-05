import * as fs from "fs";
import * as path from "path";
import { isNpmModuleImport } from "@/libs/typescript-files/utils/isNpmModuleImport";

describe("isNpmModuleImport", () => {
  let tempDir: string;
  let nodeModulesPath: string;

  // Before each test, create a temporary directory to simulate node_modules
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, "test-project-"));
    nodeModulesPath = path.join(tempDir, "node_modules");
    fs.mkdirSync(nodeModulesPath);
  });

  // After each test, remove the temporary directory and its contents
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns true for an existing NPM module 'lodash'", () => {
    // Scenario: Simulate 'lodash' as an installed NPM package
    // Example structure: node_modules/lodash/
    const modulePath = path.join(nodeModulesPath, "lodash");
    fs.mkdirSync(modulePath);

    const result = isNpmModuleImport("lodash", nodeModulesPath);

    // Expectation: The function should return true for an existing NPM module
    expect(result).toBe(true);
  });

  test("returns true for an existing NPM scoped module '@types/node'", () => {
    // Scenario: Simulate an installed scoped NPM package '@types/node'
    // Example structure: node_modules/@types/node/
    const scopedModulePath = path.join(nodeModulesPath, "@types", "node");
    fs.mkdirSync(scopedModulePath, { recursive: true });

    const result = isNpmModuleImport("@types/node", nodeModulesPath);

    // Expectation: The function should return true for an existing scoped NPM module
    expect(result).toBe(true);
  });

  test("returns false for a non-existent module 'nonexistent'", () => {
    // Scenario: The module 'nonexistent' does not exist in node_modules
    // Example structure: node_modules/ (no 'nonexistent' directory)
    const result = isNpmModuleImport("nonexistent", nodeModulesPath);

    // Expectation: The function should return false since 'nonexistent' is not installed
    expect(result).toBe(false);
  });

  test("returns false for a relative path './utils/helper'", () => {
    // Scenario: A relative path should not match any NPM modules
    const modulePath = "./utils/helper";
    const result = isNpmModuleImport(modulePath, nodeModulesPath);

    // Expectation: The function should return false for a relative path
    expect(result).toBe(false);
  });

  test("returns false for an absolute path '/src/utils/helper'", () => {
    // Scenario: An absolute path is provided and should not match an NPM module
    const modulePath = "/src/utils/helper";
    const result = isNpmModuleImport(modulePath, nodeModulesPath);

    // Expectation: The function should return false for an absolute path
    expect(result).toBe(false);
  });
});
