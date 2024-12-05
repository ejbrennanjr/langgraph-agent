import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getNodeModulePath } from "@/libs/typescript-files/utils/getNodeModulePath";

describe("getNodeModulePath", () => {
  let tempDir: string;

  // Before each test, create a unique temporary directory outside of the main project structure
  // This avoids accidentally finding a node_modules folder in the actual project hierarchy
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-project-"));
  });

  // After each test, remove the temporary directory to ensure a clean environment
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("finds node_modules at the project root", () => {
    // Scenario: node_modules is located directly at the project root.
    // Example structure:
    // tempDir/
    // └── node_modules/
    const nodeModulesPath = path.join(tempDir, "node_modules");
    fs.mkdirSync(nodeModulesPath);

    const result = getNodeModulePath(tempDir);

    // Expectation: The function should return the path to node_modules in tempDir
    expect(result).toBe(nodeModulesPath);
  });

  test("finds node_modules in a parent directory", () => {
    // Scenario: node_modules is located in a parent directory, while starting from a nested directory.
    // Example structure:
    // tempDir/
    // ├── node_modules/
    // └── src/
    //     └── components/ (starting directory for search)
    const nodeModulesPath = path.join(tempDir, "node_modules");
    const subDir = path.join(tempDir, "src", "components");
    fs.mkdirSync(nodeModulesPath, { recursive: true });
    fs.mkdirSync(subDir, { recursive: true });

    const result = getNodeModulePath(subDir);

    // Expectation: The function should find node_modules in the parent directory (tempDir/node_modules)
    expect(result).toBe(nodeModulesPath);
  });

  test("returns null if node_modules is not found", () => {
    // Scenario: No node_modules directory exists in the directory hierarchy.
    // Example structure:
    // tempDir/
    // └── src/ (starting directory for search, but no node_modules in the tree)
    const result = getNodeModulePath(tempDir);

    // Expectation: The function should return null since no node_modules directory is found
    expect(result).toBeNull();
  });

  test("finds the closest node_modules in nested structures", () => {
    // Scenario: Multiple node_modules directories exist, and the function should find the closest one.
    // Example structure:
    // tempDir/
    // ├── node_modules/ (higher-level node_modules)
    // └── src/
    //     ├── node_modules/ (closer node_modules)
    //     └── utils/ (starting directory for search)
    const rootNodeModules = path.join(tempDir, "node_modules");
    const nestedNodeModules = path.join(tempDir, "src", "node_modules");
    const nestedDir = path.join(tempDir, "src", "utils");
    fs.mkdirSync(rootNodeModules, { recursive: true });
    fs.mkdirSync(nestedNodeModules, { recursive: true });
    fs.mkdirSync(nestedDir, { recursive: true });

    const result = getNodeModulePath(nestedDir);

    // Expectation: The function should return the path to the closest node_modules (tempDir/src/node_modules)
    expect(result).toBe(nestedNodeModules);
  });

  test("finds node_modules starting from node_modules itself", () => {
    // Scenario: The starting directory is already node_modules.
    // Example structure:
    // tempDir/
    // └── node_modules/ (starting directory for search)
    const nodeModulesPath = path.join(tempDir, "node_modules");
    fs.mkdirSync(nodeModulesPath);

    const result = getNodeModulePath(nodeModulesPath);

    // Expectation: The function should return the path to node_modules itself
    expect(result).toBe(nodeModulesPath);
  });
});
