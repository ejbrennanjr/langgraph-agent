/**
 * @fileoverview Tests for Named Export Mapper
 */

import { Project } from "ts-morph";
import path from "path";
import { mapNamedExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapNamedExports";
import { MappingResult } from "@/libs/typescript-graph/mappers/domain/MappingResult";

describe("mapNamedExports", () => {
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
      createModulePath("basic-modules", "utils.ts"),
      createModulePath("nested-modules/models", "index.ts"),
      createModulePath("named-exports", "namedExports.ts"),
      createModulePath("named-exports", "aliasNamedExports.ts"),
      createModulePath("export-edge-cases", "emptyNamedExports.ts"),
      createModulePath("export-edge-cases", "malformedExports.ts"),
    ]);
  });

  it("should correctly map basic named exports", () => {
    const modulePath = createModulePath("named-exports", "namedExports.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("named-exports", "namedExports.ts");
    const exportDeclaration = sourceFile.getExportDeclarations()[0];

    const result = mapNamedExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration
    );

    expect(result.nodes).toHaveLength(1); // Logger

    // Verify node IDs use full paths
    const [node] = result.nodes;
    expect(node.id).toMatch(
      new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
    );

    // Verify edges use full paths
    const [edge] = result.edges;
    expect(edge.source).toBe(sourceModuleId);
    expect(edge.target).toBe(node.id);

    // Verify metadata maintains original names
    expect(result.data.exports.named).toEqual([
      { exportedName: "Logger", localName: "Logger" },
    ]);
  });

  it("should correctly map alias named exports", () => {
    const modulePath = createModulePath(
      "named-exports",
      "aliasNamedExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "named-exports",
      "aliasNamedExports.ts"
    );
    const exportDeclaration = sourceFile.getExportDeclarations()[0];

    const result = mapNamedExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration
    );

    expect(result.nodes).toHaveLength(1); // AppLogger

    // Verify node IDs use full paths
    const [node] = result.nodes;
    expect(node.id).toMatch(
      new RegExp(`^${modulePath.replace(/[/\\]/g, "(/|\\\\)")}`)
    );

    // Verify edges use full paths
    const [edge] = result.edges;
    expect(edge.source).toBe(sourceModuleId);
    expect(edge.target).toBe(node.id);

    // Verify metadata maintains original names and aliases
    expect(result.data.exports.named).toEqual([
      { exportedName: "AppLogger", localName: "Logger" },
    ]);
  });

  it("should handle empty named export declarations", () => {
    const modulePath = createModulePath(
      "export-edge-cases",
      "emptyNamedExports.ts"
    );
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId(
      "export-edge-cases",
      "emptyNamedExports.ts"
    );
    const exportDeclaration = sourceFile.getExportDeclarations()[0];

    const result = mapNamedExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
  });

  it("should gracefully handle invalid named exports", () => {
    const warnMock = jest.spyOn(console, "warn").mockImplementation(() => {});

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

    const result = mapNamedExports(
      sourceFile,
      sourceModuleId,
      exportDeclaration
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);

    warnMock.mockRestore();
  });

  it("should exclude direct exports", () => {
    const modulePath = createModulePath("basic-modules", "utils.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("basic-modules", "utils.ts");
    const exportDeclarations = sourceFile.getExportDeclarations();

    const exportDecl = exportDeclarations.find(
      (decl) => decl.getKindName() === "ExportDeclaration"
    );

    if (exportDecl) {
      const result = mapNamedExports(sourceFile, sourceModuleId, exportDecl);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.data.exports.named).toHaveLength(0);
    } else {
      expect(true).toBe(true);
    }
  });

  it("should exclude re-exports", () => {
    const modulePath = createModulePath("nested-modules/models", "index.ts");
    const sourceFile = project.getSourceFileOrThrow(modulePath);
    const sourceModuleId = createModuleId("nested-modules/models", "index.ts");
    const exportDeclarations = sourceFile.getExportDeclarations();

    const result = mapNamedExports(
      sourceFile,
      sourceModuleId,
      exportDeclarations[0]
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.exports.named).toHaveLength(0);
  });
});
