import { Project } from "ts-morph";
import path from "path";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { mapDefaultImport } from "@/libs/typescript-graph/mappers/usecases/module/usecases/imports/usecases/mapDefaultImport";

describe("mapDefaultImport", () => {
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

    project.addSourceFilesAtPaths([
      createModulePath("sourceValues.ts"),
      createModulePath("sourceTypes.ts"),
      createModulePath("defaultImports.ts"),
      createModulePath("externalImports.ts"),
      createModulePath("namedOnlyImports.ts"),
    ]);
  });

  it("should correctly map a basic default import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("defaultImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[0]; // First import: import DefaultClass from './sourceValues';

    const sourceModuleId = createModuleId("defaultImports.ts");
    const referenceModuleId = createModuleId("sourceValues.ts");
    const referenceModulePath = createModulePath("sourceValues.ts");

    const result = mapDefaultImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Verify nodes
    expect(result.nodes).toHaveLength(1);
    const [defaultNode] = result.nodes;
    expect(defaultNode).toMatchObject({
      name: "DefaultClass",
      type: TypeScriptNodeTypes.Class,
      scope: TypeScriptExportValues.Internal,
    });

    // Verify node ID uses full path
    expect(defaultNode.id).toBe(`${referenceModulePath}::class::DefaultClass`);

    // Verify edges
    expect(result.edges).toHaveLength(2);
    const [importEdge, exportEdge] = result.edges;

    // Check import relationship
    expect(importEdge).toMatchObject({
      source: sourceModuleId,
      target: defaultNode.id,
      label: TypeScriptEdgeRelationshipValues.ModuleImportsDefault,
    });

    // Check export relationship
    expect(exportEdge).toMatchObject({
      source: referenceModuleId,
      target: defaultNode.id,
      label: TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
    });

    // Verify module data uses relative path
    expect(result.data).toMatchObject({
      imports: {
        named: [],
        namespaces: [],
        defaults: [
          {
            modulePath: "./sourceValues",
            alias: null,
          },
        ],
      },
    });
  });

  it("should correctly map a default import with type-only flag", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("defaultImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[2]; // Third import: import type DefaultType from './sourceTypes';

    const sourceModuleId = createModuleId("defaultImports.ts");
    const referenceModuleId = createModuleId("sourceTypes.ts");
    const referenceModulePath = createModulePath("sourceTypes.ts");

    const result = mapDefaultImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Verify nodes
    expect(result.nodes).toHaveLength(1);
    const [defaultNode] = result.nodes;
    expect(defaultNode).toMatchObject({
      name: "DefaultType",
      type: TypeScriptNodeTypes.Interface,
      scope: TypeScriptExportValues.Internal,
    });

    // Verify node ID
    expect(defaultNode.id).toBe(
      `${referenceModulePath}::interface::DefaultType`
    );

    // Verify relationships and metadata
    expect(result.edges).toHaveLength(2);
    expect(result.data.imports.defaults[0].modulePath).toBe("./sourceTypes");
  });

  it("should correctly map an external default import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("externalImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[0]; // import React from 'react';

    const sourceModuleId = createModuleId("externalImports.ts");

    const result = mapDefaultImport(
      sourceModuleId,
      "react::module::react",
      "react", // For external modules, keep the package name
      importDecl,
      true
    );

    // Verify external import node
    expect(result.nodes).toHaveLength(1);
    const [defaultNode] = result.nodes;
    expect(defaultNode).toMatchObject({
      name: "React",
      type: TypeScriptNodeTypes.ExternalImportEntity,
      scope: TypeScriptExportValues.External,
    });

    // Verify node ID uses package name
    expect(defaultNode.id).toBe("react::external-import-entity::React");

    // Verify relationships
    expect(result.edges).toHaveLength(2);
    expect(
      result.edges.some(
        (edge) =>
          edge.label ===
            TypeScriptEdgeRelationshipValues.ModuleImportsDefault &&
          edge.source === sourceModuleId &&
          edge.target === defaultNode.id
      )
    ).toBe(true);

    // Verify metadata uses package name
    expect(result.data.imports.defaults[0].modulePath).toBe("react");
  });

  it("should handle default imports with additional named imports", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("defaultImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[1]; // import DefaultInterface, { UserInterface } from './sourceTypes';

    const sourceModuleId = createModuleId("defaultImports.ts");
    const referenceModuleId = createModuleId("sourceTypes.ts");
    const referenceModulePath = createModulePath("sourceTypes.ts");

    const result = mapDefaultImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Verify node
    expect(result.nodes).toHaveLength(1);
    const [defaultNode] = result.nodes;
    expect(defaultNode).toMatchObject({
      name: "DefaultInterface",
      type: TypeScriptNodeTypes.Interface,
    });

    // Verify node ID uses full path
    expect(defaultNode.id).toBe(
      `${referenceModulePath}::interface::DefaultInterface`
    );

    // Verify metadata
    expect(result.data.imports.defaults).toHaveLength(1);
    expect(result.data.imports.defaults[0].modulePath).toBe("./sourceTypes");
    expect(result.data.imports.named).toHaveLength(0);
  });

  it("should return empty result for import declaration without default import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namedOnlyImports.ts")
    );
    const importDecl = sourceFile.getImportDeclarations()[0]; // Named-only import

    const sourceModuleId = createModuleId("namedOnlyImports.ts");
    const referenceModuleId = createModuleId("sourceValues.ts");
    const referenceModulePath = createModulePath("sourceValues.ts");

    const result = mapDefaultImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.imports.defaults).toHaveLength(0);
  });
});
