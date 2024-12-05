/**
 * @fileoverview Tests for Direct Export Mapper
 */

import { Project } from "ts-morph";
import path from "path";
import { mapDirectExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapDirectExports";
import { MappingResult } from "@/libs/typescript-graph/mappers/domain/MappingResult";

describe("mapDirectExports", () => {
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

    // Add source files using helper function
    project.addSourceFilesAtPaths([
      createModulePath("basic-modules", "utils.ts"),
      createModulePath("basic-modules", "types.ts"),
      createModulePath("basic-modules", "userService.ts"),
      createModulePath("nested-modules/models", "index.ts"),
      createModulePath("export-edge-cases", "codeWithoutExports.ts"),
      createModulePath("export-edge-cases", "malformedExports.ts"),
      createModulePath("export-edge-cases", "emptyFile.ts"),
      createModulePath("export-edge-cases", "directAliasExports.ts"),
    ]);
  });

  it("should correctly map named exports", () => {
    const modulePath = createModulePath("basic-modules", "utils.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("basic-modules", "utils.ts");
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(3); // Logger, formatDate, API_URL

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
    expect(result.data.exports.named).toHaveLength(3);
  });

  it("should correctly map default and named exports", () => {
    const modulePath = createModulePath("basic-modules", "types.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("basic-modules", "types.ts");
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(3); // User, UserRole, AuthConfig

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
    expect(result.data.exports.named).toHaveLength(2); // User and UserRole
    expect(result.data.exports.default).toBeDefined(); // AuthConfig
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
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();
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
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(1); // validExport only
    expect(result.edges).toHaveLength(1);
    expect(result.data.exports.named).toHaveLength(1);
  });

  it("should handle an empty file gracefully", () => {
    const modulePath = createModulePath("export-edge-cases", "emptyFile.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("export-edge-cases", "emptyFile.ts");
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();
  });

  it("should ignore re-exports", () => {
    const modulePath = createModulePath("nested-modules/models", "index.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("nested-modules/models", "index.ts");
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
    expect(result.data.exports.default).toBeUndefined();
  });

  it("should correctly map direct alias exports", () => {
    const modulePath = createModulePath(
      "export-edge-cases",
      "directAliasExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "export-edge-cases",
      "directAliasExports.ts"
    );
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    const result: MappingResult = mapDirectExports(
      sourceFile,
      sourceModuleId,
      exportedDeclarations
    );

    // Verify nodes and edges use full paths
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

    expect(result.nodes).toHaveLength(2); // aliasedValue and renamedValue
    expect(result.edges).toHaveLength(2);

    // Verify metadata correctly maps original and exported names
    expect(result.data.exports.named).toEqual([
      {
        exportedName: "aliasedValue",
        localName: "originalValue",
        source: undefined,
      },
      {
        exportedName: "renamedValue",
        localName: "anotherValue",
        source: undefined,
      },
    ]);

    expect(result.data.exports.default).toBeUndefined();
  });
});
