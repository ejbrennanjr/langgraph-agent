import { Project } from "ts-morph";
import path from "path";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { mapNamedImports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/imports/usecases/mapNamedImports";

describe("mapNamedImports", () => {
  let project: Project;
  const fixturesPath = path.join(
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
    const fixtureTsConfigPath = path.join(
      process.cwd(),
      "src/x-tests/fixtures/tsconfig.json"
    );
    project = new Project({
      tsConfigFilePath: fixtureTsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });

    project.addSourceFilesAtPaths([path.join(fixturesPath, "*.ts")]);
  });

  it("should map basic named value imports correctly", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namedImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[0];
    // import { STRING_VALUE, NUMBER_VALUE } from './sourceValues';

    const sourceModuleId = createModuleId("namedImports.ts");
    const referenceModuleId = createModuleId("sourceValues.ts");
    const referenceModulePath = createModulePath("sourceValues.ts");

    const result = mapNamedImports(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Verify nodes
    expect(result.nodes).toHaveLength(2);
    const stringValueNode = result.nodes.find((n) => n.name === "STRING_VALUE");
    const numberValueNode = result.nodes.find((n) => n.name === "NUMBER_VALUE");

    expect(stringValueNode).toMatchObject({
      type: TypeScriptNodeTypes.Variable,
      scope: TypeScriptExportValues.Internal,
    });

    // Verify node IDs use full paths
    expect(stringValueNode!.id).toBe(
      `${referenceModulePath}::variable::STRING_VALUE`
    );
    expect(numberValueNode!.id).toBe(
      `${referenceModulePath}::variable::NUMBER_VALUE`
    );

    // Verify edges
    expect(result.edges).toHaveLength(4);
    const importEdges = result.edges.filter(
      (e) => e.label === TypeScriptEdgeRelationshipValues.ModuleImportsNamed
    );

    // Verify edge paths
    importEdges.forEach((edge) => {
      expect(edge.source).toBe(sourceModuleId);
      expect(edge.target).toMatch(new RegExp(`^${referenceModulePath}::`));
    });

    // Verify import metadata still uses relative paths
    expect(result.data.imports.named).toEqual([
      { modulePath: "./sourceValues", name: "STRING_VALUE", alias: null },
      { modulePath: "./sourceValues", name: "NUMBER_VALUE", alias: null },
    ]);
  });

  it("should map external named imports correctly", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("externalImports.ts")
    );
    const sourceModuleId = createModuleId("externalImports.ts");
    const importDecl = sourceFile.getImportDeclarations()[1];
    // import { useState, useEffect } from 'react';

    const result = mapNamedImports(
      sourceModuleId,
      "react::module::react",
      "react", // External modules keep their package name
      importDecl,
      true
    );

    // Verify nodes
    expect(result.nodes).toHaveLength(2);
    result.nodes.forEach((node) => {
      expect(node).toMatchObject({
        type: TypeScriptNodeTypes.ExternalImportEntity,
        scope: TypeScriptExportValues.External,
      });
      // External module node IDs should use the package name
      expect(node.id).toMatch(/^react::external-import-entity::/);
    });

    // Verify edges point to correct external nodes
    const importEdges = result.edges.filter(
      (e) => e.label === TypeScriptEdgeRelationshipValues.ModuleImportsNamed
    );
    importEdges.forEach((edge) => {
      expect(edge.source).toBe(sourceModuleId);
      expect(edge.target).toMatch(/^react::external-import-entity::/);
    });

    // Verify import metadata keeps package name
    expect(result.data.imports.named).toEqual([
      { modulePath: "react", name: "useState", alias: null },
      { modulePath: "react", name: "useEffect", alias: null },
    ]);
  });

  it("should handle multiple imports of same named export from different files", () => {
    const sourceFile1 = project.getSourceFileOrThrow(
      createModulePath("namedImports.ts")
    );
    const sourceFile2 = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );

    const sourceModuleId1 = createModuleId("namedImports.ts");
    const sourceModuleId2 = createModuleId("namespaceImports.ts");
    const referenceModuleId = createModuleId("sourceTypes.ts");
    const referenceModulePath = createModulePath("sourceTypes.ts");

    // Both files import UserInterface
    const importDecl1 = sourceFile1.getImportDeclarations()[2];
    const importDecl2 = sourceFile2.getImportDeclarations()[2];

    const result1 = mapNamedImports(
      sourceModuleId1,
      referenceModuleId,
      referenceModulePath,
      importDecl1,
      false
    );

    const result2 = mapNamedImports(
      sourceModuleId2,
      referenceModuleId,
      referenceModulePath,
      importDecl2,
      false
    );

    // Verify node IDs use full paths
    expect(result1.nodes[0].id).toBe(
      `${referenceModulePath}::interface::UserInterface`
    );
    expect(result2.nodes[0].id).toBe(
      `${referenceModulePath}::interface::UserInterface`
    );

    // Verify edges use full paths for source module IDs
    expect(result1.edges[0].source).toBe(sourceModuleId1);
    expect(result2.edges[0].source).toBe(sourceModuleId2);

    // Verify import metadata keeps relative paths
    expect(result1.data.imports.named[0].modulePath).toBe("./sourceTypes");
    expect(result2.data.imports.named[0].modulePath).toBe("./sourceTypes");
  });
});
