import * as fs from "fs";
import * as path from "path";
import { loadTsConfig } from "@/libs/typescript-files/utils/loadTsConfig";

describe("loadTsConfig", () => {
  let tempDir: string;
  let tsConfigPath: string;

  // Create a temporary directory before each test
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, "test-project-"));
    tsConfigPath = path.join(tempDir, "tsconfig.json");
  });

  // Remove the temporary directory after each test
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("loads a valid tsconfig.json with baseUrl and paths", () => {
    // Scenario: tsconfig.json contains baseUrl and paths properties
    const tsConfigContent = {
      compilerOptions: {
        baseUrl: "./src",
        paths: {
          "@/components/*": ["components/*"],
          "@/utils/*": ["utils/*"],
        },
      },
    };
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfigContent));

    const result = loadTsConfig(tempDir);

    // Expectation: The function should return the baseUrl and paths as defined
    expect(result).toEqual(tsConfigContent);
  });

  test("loads tsconfig.json without paths", () => {
    // Scenario: tsconfig.json contains baseUrl but no paths
    const tsConfigContent = {
      compilerOptions: {
        baseUrl: "./src",
      },
    };
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfigContent));

    const result = loadTsConfig(tempDir);

    // Expectation: The function should load baseUrl correctly, with paths undefined
    expect(result).toEqual(tsConfigContent);
  });

  test("returns null if tsconfig.json is missing", () => {
    // Scenario: No tsconfig.json file exists in the directory
    const result = loadTsConfig(tempDir);

    // Expectation: The function should return null
    expect(result).toBeNull();
  });

  test("throws an error for invalid JSON format", () => {
    // Scenario: tsconfig.json contains malformed JSON
    fs.writeFileSync(tsConfigPath, "{ invalidJson: true ");

    // Expectation: The function should throw an error
    expect(() => loadTsConfig(tempDir)).toThrow(SyntaxError);
  });

  test("loads an empty tsconfig.json", () => {
    // Scenario: tsconfig.json exists but is empty
    fs.writeFileSync(tsConfigPath, "{}");

    const result = loadTsConfig(tempDir);

    // Expectation: The function should return an empty object
    expect(result).toEqual({});
  });
});
