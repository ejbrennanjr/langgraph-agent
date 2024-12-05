/**
 * @fileoverview Tests for Re-Export Mapper
 */

import { Project } from "ts-morph";
import path from "path";
import { mapReExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapReExports";
import { MappingResult } from "@/libs/typescript-graph/mappers/domain/MappingResult";

describe("mapReExports", () => {
  let project: Project;
  const fixturesPath = path.join(process.cwd(), "src/x-tests/fixtures");

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
      createModulePath("export-edge-cases", "malformedExports.ts"),
      createModulePath("basic-modules", "utils.ts"),
      createModulePath("export-edge-cases", "emptyFile.ts"),
    ]);
  });

  it("should correctly map named re-exports", () => {
    const modulePath = createModulePath("nested-modules/models", "index.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("nested-modules/models", "index.ts");

    const exportDeclaration = sourceFile
      .getExportDeclarations()
      .find((decl) => decl.getNamedExports().length > 0);

    const result: MappingResult = mapReExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration!
    );

    expect(result.nodes).toHaveLength(1);

    // Verify node IDs use full paths
    const [node] = result.nodes;
    expect(node.id).toMatch(
      new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
    );

    // Verify edges use full paths
    const [edge] = result.edges;
    expect(edge.source).toBe(sourceModuleId);
    expect(edge.target).toBe(node.id);

    // Verify metadata maintains relative paths
    expect(result.data.exports.reExports).toEqual([
      { source: "./user", name: "UserProfile", alias: "Profile" },
    ]);
  });

  it("should correctly map wildcard re-exports", () => {
    const modulePath = createModulePath("nested-modules/models", "index.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("nested-modules/models", "index.ts");

    const exportDeclaration = sourceFile
      .getExportDeclarations()
      .find((decl) => decl.getNamedExports().length === 0);

    const result: MappingResult = mapReExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration!
    );

    expect(result.nodes).toHaveLength(1);

    // Verify node IDs use full paths
    const [node] = result.nodes;
    expect(node.id).toMatch(
      new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
    );

    // Verify edges use full paths
    const [edge] = result.edges;
    expect(edge.source).toBe(sourceModuleId);
    expect(edge.target).toBe(node.id);

    // Verify metadata maintains relative paths
    expect(result.data.exports.wildcards).toEqual(["./user"]);
  });

  it("should gracefully handle malformed re-exports", () => {
    const modulePath = createModulePath(
      "export-edge-cases",
      "malformedExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "export-edge-cases",
      "malformedExports.ts"
    );
    const exportDeclaration = sourceFile.getExportDeclarations()[0];

    const result: MappingResult = mapReExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.reExports).toHaveLength(0);
  });

  it("should exclude direct exports", () => {
    const modulePath = createModulePath("basic-modules", "utils.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("basic-modules", "utils.ts");
    const exportDeclarations = sourceFile.getExportDeclarations();

    exportDeclarations.forEach((exportDeclaration) => {
      const result = mapReExports(
        sourceFile,
        sourceModuleId,
        exportDeclaration
      );

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.data.exports.reExports).toHaveLength(0);
    });
  });

  it("should handle empty files gracefully", () => {
    const modulePath = createModulePath("export-edge-cases", "emptyFile.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("export-edge-cases", "emptyFile.ts");
    const exportDeclarations = sourceFile.getExportDeclarations();

    exportDeclarations.forEach((exportDeclaration) => {
      const result = mapReExports(
        sourceFile,
        sourceModuleId,
        exportDeclaration
      );

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.data.exports.reExports).toHaveLength(0);
    });
  });
});
