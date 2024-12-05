/**
 * @fileoverview Tests for Module Exports Mapper
 */

import { Project } from "ts-morph";
import path from "path";
import { mapModuleExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/mapModuleExports";
import { MappingResult } from "@/libs/typescript-graph/mappers/domain/MappingResult";

describe("mapModuleExports", () => {
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
      createModulePath("nested-modules/models", "index.ts"),
      createModulePath("basic-modules", "utils.ts"),
      createModulePath("basic-modules", "types.ts"),
      createModulePath("export-edge-cases", "malformedExports.ts"),
      createModulePath("export-edge-cases", "codeWithoutExports.ts"),
      createModulePath("export-edge-cases", "emptyFile.ts"),
    ]);
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  it("should correctly map mixed named, default, and re-exports", () => {
    const modulePath = createModulePath("basic-modules", "types.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("basic-modules", "types.ts");

    const result: MappingResult = mapModuleExports(sourceFile, sourceModuleId);

    expect(result.nodes).toHaveLength(3);

    // Verify node IDs use full paths
    result.nodes.forEach((node) => {
      expect(node.id).toMatch(
        new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
      );
    });

    // Verify edges use full paths
    result.edges.forEach((edge) => {
      expect(edge.source).toBe(sourceModuleId);
      expect(edge.target).toMatch(
        new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
      );
    });

    // Named: User, UserRole; Default: AuthConfig
    expect(result.edges).toHaveLength(3);
    expect(result.data.exports.named).toHaveLength(2);
    expect(result.data.exports.default).toBeDefined();
    expect(result.data.exports.reExports).toHaveLength(0);
  });

  it("should correctly map re-exports", () => {
    const modulePath = createModulePath("nested-modules/models", "index.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("nested-modules/models", "index.ts");

    const result: MappingResult = mapModuleExports(sourceFile, sourceModuleId);

    expect(result.nodes).toHaveLength(3);

    // Verify node IDs use full paths
    result.nodes.forEach((node) => {
      expect(node.id).toMatch(
        new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
      );
    });

    // Verify edges use full paths
    result.edges.forEach((edge) => {
      expect(edge.source).toBe(sourceModuleId);
      expect(edge.target).toMatch(
        new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
      );
    });

    expect(result.edges).toHaveLength(3);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();

    // Verify metadata maintains relative paths
    expect(result.data.exports.reExports).toEqual([
      { source: "./user", name: "UserProfile", alias: "Profile" },
    ]);
  });

  it("should handle files with no exports", () => {
    const modulePath = createModulePath(
      "export-edge-cases",
      "codeWithoutExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "export-edge-cases",
      "codeWithoutExports.ts"
    );

    const result: MappingResult = mapModuleExports(sourceFile, sourceModuleId);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();
    expect(result.data.exports.reExports).toHaveLength(0);
  });

  it("should gracefully handle malformed exports", () => {
    const modulePath = createModulePath(
      "export-edge-cases",
      "malformedExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "export-edge-cases",
      "malformedExports.ts"
    );

    const result: MappingResult = mapModuleExports(sourceFile, sourceModuleId);

    expect(result.nodes).toHaveLength(1); // validExport

    // Verify node IDs use full paths
    const [node] = result.nodes;
    expect(node.id).toMatch(
      new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
    );

    // Verify edges use full paths
    const [edge] = result.edges;
    expect(edge.source).toBe(sourceModuleId);
    expect(edge.target).toBe(node.id);

    expect(result.edges).toHaveLength(1);
    expect(result.data.exports.named).toHaveLength(1);
    expect(result.data.exports.default).toBeUndefined();
    expect(result.data.exports.reExports).toHaveLength(0);

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Warning: Could not resolve the declaration of named export: nonExistentSymbol"
    );
  });

  it("should handle an empty file gracefully", () => {
    const modulePath = createModulePath("export-edge-cases", "emptyFile.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("export-edge-cases", "emptyFile.ts");

    const result: MappingResult = mapModuleExports(sourceFile, sourceModuleId);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();
    expect(result.data.exports.reExports).toHaveLength(0);
  });
});
