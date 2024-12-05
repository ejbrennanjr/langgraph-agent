import { getModuleCategory } from "@/libs/typescript-files/usecases/getModuleCategory";
import { ImportPathType } from "@/libs/typescript-files/domain/ImportPathType";
import { ModuleCategory } from "@/libs/typescript-files/domain/ModuleCategory";

// Mock getImportPathType to simulate various ImportPathType values
jest.mock("@/libs/typescript-files/usecases/getImportPathType", () => ({
  getImportPathType: jest.fn(),
}));

// Import the mock
const {
  getImportPathType,
} = require("@/libs/typescript-files/usecases/getImportPathType");

describe("getModuleCategory", () => {
  test("identifies an NPM module as External", () => {
    // Simulate getImportPathType returning ImportPathType.NpmModule
    getImportPathType.mockReturnValue(ImportPathType.NpmModule);

    const result = getModuleCategory("lodash");

    // Expectation: NPM modules are classified as External
    expect(result).toBe(ModuleCategory.External);
  });

  test("identifies a Node.js built-in module as External", () => {
    // Simulate getImportPathType returning ImportPathType.NodeBuiltInModule
    getImportPathType.mockReturnValue(ImportPathType.NodeBuiltInModule);

    const result = getModuleCategory("fs");

    // Expectation: Node.js built-in modules are classified as External
    expect(result).toBe(ModuleCategory.External);
  });

  test("identifies a relative path as Internal", () => {
    // Simulate getImportPathType returning ImportPathType.RelativePath
    getImportPathType.mockReturnValue(ImportPathType.RelativePath);

    const result = getModuleCategory("./utils/helper");

    // Expectation: Relative paths are classified as Internal
    expect(result).toBe(ModuleCategory.Internal);
  });

  test("identifies an absolute path as Internal", () => {
    // Simulate getImportPathType returning ImportPathType.AbsolutePath
    getImportPathType.mockReturnValue(ImportPathType.AbsolutePath);

    const result = getModuleCategory("/src/utils/helper");

    // Expectation: Absolute paths are classified as Internal
    expect(result).toBe(ModuleCategory.Internal);
  });

  test("identifies an alias path as Internal", () => {
    // Simulate getImportPathType returning ImportPathType.AliasPath
    getImportPathType.mockReturnValue(ImportPathType.AliasPath);

    const result = getModuleCategory("@/components/Button");

    // Expectation: Alias paths are classified as Internal
    expect(result).toBe(ModuleCategory.Internal);
  });

  test("throws an error for an unrecognized import type", () => {
    // Simulate getImportPathType returning an unknown type
    getImportPathType.mockImplementation(() => {
      throw new Error(
        "Unrecognized import type for module specifier: unknown/path"
      );
    });

    expect(() => getModuleCategory("unknown/path")).toThrow(
      "Unrecognized import type for module specifier: unknown/path"
    );
  });
});
