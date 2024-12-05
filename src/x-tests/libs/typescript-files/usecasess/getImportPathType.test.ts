import { ImportPathType } from "@/libs/typescript-files/domain/ImportPathType";
import { getImportPathType } from "@/libs/typescript-files/usecases/getImportPathType";

describe("getImportPathType", () => {
  describe("relative paths", () => {
    test("identifies a sibling path starting with ./", () => {
      const moduleSpecifier = "./utils/helper";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.RelativePath
      );
    });

    test("identifies a parent path starting with ../", () => {
      const moduleSpecifier = "../config/constants";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.RelativePath
      );
    });

    test("identifies index path .", () => {
      const moduleSpecifier = ".";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.RelativePath
      );
    });

    test("identifies nested parent paths", () => {
      const moduleSpecifier = "../../utils/helper";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.RelativePath
      );
    });
  });

  describe("absolute paths", () => {
    test("identifies Unix-style absolute path", () => {
      const moduleSpecifier = "/src/utils/helper";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.AbsolutePath
      );
    });

    test("identifies Windows-style absolute path", () => {
      const moduleSpecifier = "C:\\src\\utils\\helper";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.AbsolutePath
      );
    });
  });

  describe("alias paths", () => {
    test("identifies basic alias path", () => {
      const moduleSpecifier = "@/components/Button";
      expect(getImportPathType(moduleSpecifier)).toBe(ImportPathType.AliasPath);
    });

    test("identifies nested alias path", () => {
      const moduleSpecifier = "@/utils/helpers/string";
      expect(getImportPathType(moduleSpecifier)).toBe(ImportPathType.AliasPath);
    });
  });

  describe("Node.js built-in modules", () => {
    test("identifies node: protocol modules", () => {
      const moduleSpecifier = "node:fs";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.NodeBuiltInModule
      );
    });

    test("identifies bare built-in modules", () => {
      const moduleSpecifier = "fs";
      expect(getImportPathType(moduleSpecifier)).toBe(
        ImportPathType.NodeBuiltInModule
      );
    });
  });

  describe("NPM modules", () => {
    test("identifies bare package names", () => {
      expect(getImportPathType("react")).toBe(ImportPathType.NpmModule);
      expect(getImportPathType("lodash")).toBe(ImportPathType.NpmModule);
      expect(getImportPathType("typescript")).toBe(ImportPathType.NpmModule);
    });

    test("identifies scoped packages", () => {
      expect(getImportPathType("@types/node")).toBe(ImportPathType.NpmModule);
      expect(getImportPathType("@angular/core")).toBe(ImportPathType.NpmModule);
    });

    test("identifies package subpaths", () => {
      expect(getImportPathType("lodash/fp")).toBe(ImportPathType.NpmModule);
      expect(getImportPathType("@angular/core/testing")).toBe(
        ImportPathType.NpmModule
      );
    });
  });

  describe("error cases", () => {
    test("throws for empty string", () => {
      expect(() => getImportPathType("")).toThrow();
    });

    test("throws for invalid patterns", () => {
      expect(() => getImportPathType("~/utils/helper")).toThrow();
      expect(() => getImportPathType("$invalid/path")).toThrow();
    });
  });
});
