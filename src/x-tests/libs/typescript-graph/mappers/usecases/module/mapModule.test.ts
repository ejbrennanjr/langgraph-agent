/**
 * @fileoverview Tests for Module Mapper
 */
import path from "path";
import util from "util";

import { Project } from "ts-morph";

import { mapModule } from "@/libs/typescript-graph/mappers/usecases/module/mapModule";
import {
  TypeScriptNodeTypes,
  TypeScriptNodeStatus,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { ModuleKind } from "@/libs/typescript-graph/domain/ModuleNode";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

describe("mapModule", () => {
  let project: Project;
  const fixturesPath = path.join(process.cwd(), "src/x-tests/fixtures");
  const mockConsoleWarn = jest
    .spyOn(console, "warn")
    .mockImplementation(() => {});

  function createModuleId(subdir: string, filename: string): string {
    return `${path.join(
      fixturesPath,
      subdir,
      filename
    )}::module::${path.basename(filename, ".ts")}`;
  }

  function createModulePath(subdir: string, filename: string): string {
    return path.join(fixturesPath, subdir, filename);
  }

  beforeAll(() => {
    const fixtureTsConfigPath = path.join(
      process.cwd(),
      "src/x-tests/fixtures/tsconfig.json"
    );
    project = new Project({
      tsConfigFilePath: fixtureTsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });

    project.addSourceFilesAtPaths([
      path.join(fixturesPath, "basic-modules/*.ts"),
      path.join(fixturesPath, "import-patterns/*.ts"),
      path.join(fixturesPath, "export-edge-cases/*.ts"),
      path.join(fixturesPath, "nested-modules/**/*.ts"),
      path.join(fixturesPath, "external-modules/*.ts"),
      path.join(fixturesPath, "reexport-modules/*.ts"),
    ]);
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe("Combined Import/Export Scenarios", () => {
    it("should correctly map userService.ts with mixed imports and exports", () => {
      const modulePath = createModulePath("basic-modules", "userService.ts");
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify imports maintain relative paths in metadata
      expect(result.data.imports).toEqual({
        named: [
          { modulePath: "./types", name: "User", alias: null },
          { modulePath: "./utils", name: "API_URL", alias: null },
          { modulePath: "./utils", name: "Logger", alias: null },
        ],
        defaults: [{ modulePath: "./types", alias: null }],
        namespaces: [],
      });

      // Verify exports structure
      expect(result.data.exports).toEqual({
        named: [{ exportedName: "UserService", localName: "UserService" }],
        reExports: [],
        wildcards: [],
        default: undefined,
      });

      // Verify node IDs use full paths
      result.nodes.forEach((node) => {
        if (node.type !== TypeScriptNodeTypes.ExternalImportEntity) {
          expect(node.id).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
      });

      // Verify edges use full paths
      result.edges.forEach((edge) => {
        expect(edge.source).toMatch(
          new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
        );
        if (!edge.target.startsWith("react")) {
          // Skip external module targets
          expect(edge.target).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
      });

      // Verify node details
      const userServiceNode = result.nodes.find(
        (n) => n.name === "UserService"
      );
      expect(userServiceNode).toMatchObject({
        type: TypeScriptNodeTypes.Class,
        scope: TypeScriptExportValues.Internal,
        status: TypeScriptNodeStatus.Placeholder,
      });

      // Verify edge relationships
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          label: TypeScriptEdgeRelationshipValues.ModuleImportsNamed,
          source: expect.stringContaining(modulePath),
          target: expect.stringContaining("User"),
        })
      );
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          label: TypeScriptEdgeRelationshipValues.ModuleImportsDefault,
          source: expect.stringContaining(modulePath),
          target: expect.stringContaining("AuthConfig"),
        })
      );
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          label: TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
          source: expect.stringContaining(modulePath),
          target: expect.stringContaining("UserService"),
        })
      );
    });

    it("should correctly map complex re-export with imports", () => {
      const modulePath = createModulePath("nested-modules/models", "index.ts");
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify complete module structure with proper paths
      expect(result.data).toMatchObject({
        path: modulePath,
        moduleKind: ModuleKind.ES6,
        imports: {
          named: expect.any(Array),
          namespaces: expect.any(Array),
          defaults: expect.any(Array),
        },
        exports: {
          named: expect.any(Array),
          reExports: expect.arrayContaining([
            { source: "./user", name: "UserProfile", alias: "Profile" },
          ]),
          wildcards: expect.arrayContaining(["./user"]),
        },
      });

      // Verify all nodes use full paths
      result.nodes.forEach((node) => {
        if (node.type !== TypeScriptNodeTypes.ExternalImportEntity) {
          expect(node.id).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
      });

      // Verify all edge types are present
      const edgeLabels = new Set(result.edges.map((e) => e.label));
      // expect(edgeLabels).toContain(
      //   TypeScriptEdgeRelationshipValues.ModuleDependsOn
      // );
      expect(edgeLabels).toContain(
        TypeScriptEdgeRelationshipValues.ModuleReExports
      );
    });
  });

  describe("Schema Validation and Node Details", () => {
    it("should validate module node schema comprehensively", () => {
      const modulePath = createModulePath("import-patterns", "mixedImports.ts");
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify module node structure
      const moduleNode = result.nodes.find(
        (n) => n.type === TypeScriptNodeTypes.Module
      );
      expect(moduleNode).toMatchObject({
        id: expect.stringContaining("::module::"),
        name: "mixedImports",
        type: TypeScriptNodeTypes.Module,
        scope: TypeScriptExportValues.Internal,
        status: TypeScriptNodeStatus.Resolved,
        data: {
          path: expect.stringContaining(modulePath),
          moduleKind: ModuleKind.ES6,
          imports: {
            named: expect.any(Array),
            namespaces: expect.any(Array),
            defaults: expect.any(Array),
          },
          exports: {
            named: expect.any(Array),
            reExports: expect.any(Array),
            wildcards: expect.any(Array),
          },
        },
        location: {
          filePath: expect.any(String),
          startLine: expect.any(Number),
          startColumn: expect.any(Number),
          endLine: expect.any(Number),
          endColumn: expect.any(Number),
        },
      });

      // Verify entity nodes
      const entityNodes = result.nodes.filter(
        (n) => n.type !== TypeScriptNodeTypes.Module
      );
      entityNodes.forEach((node) => {
        if (node.type !== TypeScriptNodeTypes.ExternalImportEntity) {
          expect(node.id).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
        expect(node).toMatchObject({
          name: expect.any(String),
          type: expect.any(String),
          scope: expect.any(String),
          status: expect.any(String),
          location: expect.any(Object),
          data: expect.any(Object),
        });
      });
    });

    it("should create correct edge relationships with detailed attributes", () => {
      const modulePath = createModulePath("external-modules", "component.ts");
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify edge structure and details
      result.edges.forEach((edge) => {
        expect(edge).toMatchObject({
          id: expect.stringContaining("-->"),
          source: expect.stringContaining("::"),
          target: expect.stringContaining("::"),
          label: expect.any(String),
        });

        // Verify edge naming convention
        expect(edge.id).toBe(`${edge.source}-->${edge.label}-->${edge.target}`);

        // Verify edge source uses full path
        if (!edge.source.startsWith("react")) {
          expect(edge.source).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
      });

      // Check specific relationships
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          label: TypeScriptEdgeRelationshipValues.ModuleImportsNamed,
          source: expect.stringContaining(modulePath),
          target: expect.stringContaining("useState"),
        })
      );

      expect(result.edges).toContainEqual(
        expect.objectContaining({
          label: TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
          source: expect.stringContaining(modulePath),
          target: expect.stringContaining("Container"),
        })
      );
    });
  });

  describe("Implementation-Specific Details", () => {
    it("should handle all import variations in a single module", () => {
      const modulePath = createModulePath("import-patterns", "mixedImports.ts");
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify named imports with alias maintain relative paths
      expect(result.data.imports.named).toContainEqual({
        modulePath: "./sourceValues",
        name: "helper",
        alias: "utilHelper",
      });

      // Verify default imports maintain relative paths
      expect(result.data.imports.defaults).toContainEqual({
        modulePath: "./sourceValues",
        alias: null,
      });

      // Verify type imports
      const typeNode = result.nodes.find((n) => n.name === "Status");
      expect(typeNode).toMatchObject({
        type: TypeScriptNodeTypes.Type,
        scope: TypeScriptExportValues.Internal,
      });
      if (typeNode) {
        expect(typeNode.id).toMatch(
          new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
        );
      }
    });

    it("should correctly map export variations", () => {
      const modulePath = createModulePath(
        "reexport-modules",
        "aggregateIndex.ts"
      );
      const sourceFile = project.getSourceFileOrThrow(modulePath);
      const result = mapModule(sourceFile);

      // Verify named re-exports
      expect(result.data.exports.reExports).toContainEqual({
        source: "./values",
        name: "helper",
        alias: "globalHelper",
      });

      expect(result.data.exports.reExports).toContainEqual({
        source: "./types",
        name: "default",
        alias: "GlobalConfig",
      });

      // Verify wildcard re-exports
      expect(result.data.exports.wildcards).toContain("./values");
      expect(result.data.exports.wildcards).toContain("./types");

      // Verify node IDs use full paths
      result.nodes.forEach((node) => {
        if (node.type !== TypeScriptNodeTypes.ExternalImportEntity) {
          expect(node.id).toMatch(
            new RegExp(`^${fixturesPath.replace(/[/\\]/g, "(/|\\\\)")}`)
          );
        }
      });
    });
  });
});
