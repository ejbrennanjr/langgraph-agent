/**
 * @fileoverview Tests for Module Imports Mapper
 */

import { Project } from "ts-morph";
import path from "path";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { mapModuleImports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/imports/mapModuleImports";
import {
  NamespaceImport,
  NamedImport,
  DefaultImport,
} from "@/libs/typescript-graph/domain/ModuleNode";

describe("mapModuleImports", () => {
  let project: Project;
  const fixturesPath = path.resolve(
    process.cwd(),
    "src/x-tests/fixtures/import-patterns"
  );

  function createModuleId(filename: string): string {
    return `${path.join(fixturesPath, filename)}::module::${path.basename(
      filename,
      ".ts"
    )}`;
  }

  function createModulePath(filename: string): string {
    return path.join(fixturesPath, filename);
  }

  beforeAll(() => {
    const fixtureTsConfigPath = path.resolve(
      process.cwd(),
      "src/x-tests/fixtures/tsconfig.json"
    );
    project = new Project({
      tsConfigFilePath: fixtureTsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });

    project.addSourceFilesAtPaths([path.join(fixturesPath, "*.ts")]);
  });

  describe("module dependencies", () => {
    it("should create dependency edges using resolved paths", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("mixedImports.ts")
      );
      const sourceModuleId = createModuleId("mixedImports.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      const dependencyEdges = result.edges.filter(
        (e) => e.label === TypeScriptEdgeRelationshipValues.ModuleDependsOn
      );

      // Verify edges use full paths
      dependencyEdges.forEach((edge) => {
        expect(edge.source).toBe(sourceModuleId);
        expect(edge.target).toMatch(
          new RegExp(
            `^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}.*::module::`
          )
        );
      });

      // Verify import metadata uses relative paths
      result.data.imports.defaults.forEach((defaultImport: DefaultImport) => {
        expect(defaultImport.modulePath).toMatch(/^\.\/|^[a-zA-Z]/); // Starts with ./ or a package name
      });
      result.data.imports.named.forEach((namedImport: NamedImport) => {
        expect(namedImport.modulePath).toMatch(/^\.\/|^[a-zA-Z]/);
      });
      result.data.imports.namespaces.forEach(
        (namespaceImport: NamespaceImport) => {
          expect(namespaceImport.modulePath).toMatch(/^\.\/|^[a-zA-Z]/);
        }
      );
    });
  });

  describe("basic functionality", () => {
    it("should map a file with no imports correctly", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("sourceValues.ts")
      );
      const sourceModuleId = createModuleId("sourceValues.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.data.imports).toEqual({
        named: [],
        namespaces: [],
        defaults: [],
      });
    });
  });

  describe("internal module imports", () => {
    it("should map mixed imports from internal modules", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("mixedImports.ts")
      );
      const sourceModuleId = createModuleId("mixedImports.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      expect(result.nodes).toHaveLength(9);

      // Verify specific nodes
      const defaultNode = result.nodes.find((n) => n.name === "DefaultClass");
      const stringValueNode = result.nodes.find(
        (n) => n.name === "STRING_VALUE"
      );
      const utilityNode = result.nodes.find((n) => n.name === "Utility");
      const statusNode = result.nodes.find((n) => n.name === "Status");
      const namespaceNode = result.nodes.find(
        (n) => n.type === TypeScriptNodeTypes.NamespaceImport
      );
      const moduleNodes = result.nodes.filter(
        (n) => n.type === TypeScriptNodeTypes.Module
      );

      // Verify node types
      expect(defaultNode?.type).toBe(TypeScriptNodeTypes.Class);
      expect(stringValueNode?.type).toBe(TypeScriptNodeTypes.Variable);
      expect(utilityNode?.type).toBe(TypeScriptNodeTypes.Class);
      expect(statusNode?.type).toBe(TypeScriptNodeTypes.Type);
      expect(namespaceNode?.name).toBe("types");
      expect(moduleNodes).toHaveLength(3);

      // Verify node IDs use full paths
      moduleNodes.forEach((node) => {
        expect(node.id).toMatch(
          new RegExp(
            `^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}.*::module::`
          )
        );
      });

      // Verify edges
      const moduleDepEdges = result.edges.filter(
        (e) => e.label === TypeScriptEdgeRelationshipValues.ModuleDependsOn
      );
      expect(moduleDepEdges).toHaveLength(2);

      const importEdges = result.edges.filter(
        (e) =>
          e.label === TypeScriptEdgeRelationshipValues.ModuleImportsDefault ||
          e.label === TypeScriptEdgeRelationshipValues.ModuleImportsNamed ||
          e.label === TypeScriptEdgeRelationshipValues.ModuleImportsNamespace
      );
      expect(importEdges).toHaveLength(6);

      // Verify import metadata uses relative paths
      expect(result.data.imports.defaults).toHaveLength(1);
      expect(result.data.imports.defaults[0].modulePath).toMatch(/^\.\//);
      result.data.imports.named.forEach((namedImport: NamedImport) => {
        expect(namedImport.modulePath).toMatch(/^\.\//);
      });
      expect(result.data.imports.namespaces[0].modulePath).toMatch(/^\.\//);
    });
  });

  describe("node ID generation", () => {
    it("should generate correct node IDs for internal modules", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("mixedImports.ts")
      );
      const sourceModuleId = createModuleId("mixedImports.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      const expectedNodeId = createModuleId("sourceValues.ts");

      const moduleNode = result.nodes.find(
        (node) =>
          node.type === TypeScriptNodeTypes.Module && node.id === expectedNodeId
      );
      expect(moduleNode).toBeDefined();
    });

    it("should generate correct node IDs for external modules", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("externalImports.ts")
      );
      const sourceModuleId = createModuleId("externalImports.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      const externalNode = result.nodes.find(
        (node) => node.type === TypeScriptNodeTypes.ExternalModule
      );

      // External modules use package name in ID with "external-module" type
      expect(externalNode?.id).toBe("react::external-module::react");

      // Verify import metadata uses package name
      const reactImports = result.data.imports.named.filter(
        (imp: NamedImport) => imp.modulePath === "react"
      );
      expect(reactImports.length).toBeGreaterThan(0);
    });
  });

  describe("namespace imports", () => {
    it("should handle namespace imports alongside other imports", () => {
      const sourceFile = project.getSourceFileOrThrow(
        createModulePath("namespaceImports.ts")
      );
      const sourceModuleId = createModuleId("namespaceImports.ts");

      const result = mapModuleImports(sourceFile, sourceModuleId);

      const namespaceNodes = result.nodes.filter(
        (n) => n.type === TypeScriptNodeTypes.NamespaceImport
      );
      expect(namespaceNodes.length).toBeGreaterThan(0);

      // Verify node IDs use full paths
      namespaceNodes.forEach((node) => {
        expect(node.id).toMatch(
          new RegExp(
            `^${fixturesPath.replace(
              /[/\\]/g,
              "(/|\\\\)"
            )}.*::namespace-import::`
          )
        );
      });

      const namespaceEdges = result.edges.filter(
        (e) =>
          e.label === TypeScriptEdgeRelationshipValues.ModuleImportsNamespace
      );
      expect(namespaceEdges.length).toBeGreaterThan(0);

      namespaceNodes.forEach((node) => {
        expect(node.data).toHaveProperty("namespaceName");
        expect(typeof node.data.namespaceName).toBe("string");
      });

      // Verify import metadata uses relative paths
      expect(result.data.imports.namespaces.length).toBeGreaterThan(0);
      result.data.imports.namespaces.forEach((ns: NamespaceImport) => {
        expect(ns.modulePath).toMatch(/^\.\/|^[a-zA-Z]/);
        expect(ns).toHaveProperty("alias");
      });
    });
  });

  describe("error handling", () => {
    it("should handle import syntax errors gracefully", () => {
      const invalidFilePath = createModulePath("invalid.ts");
      const invalidFile = project.createSourceFile(
        invalidFilePath,
        'import { from "./invalid";'
      );

      const sourceModuleId = createModuleId("invalid.ts");
      const result = mapModuleImports(invalidFile, sourceModuleId);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.data.imports).toEqual({
        named: [],
        namespaces: [],
        defaults: [],
      });

      project.removeSourceFile(invalidFile);
    });
  });
});
