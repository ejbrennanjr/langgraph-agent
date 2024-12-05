import { Project } from "ts-morph";
import path from "path";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { mapNamespaceImport } from "@/libs/typescript-graph/mappers/usecases/module/usecases/imports/usecases/mapNamespaceImport";

describe("mapNamespaceImport", () => {
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
      createModulePath("namespaceImports.ts"),
      createModulePath("externalImports.ts"),
      createModulePath("mixedImports.ts"),
    ]);
  });

  it("should correctly map a basic namespace import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );

    const sourceModuleId = createModuleId("namespaceImports.ts");
    const referenceModuleId = createModuleId("sourceValues.ts");
    const referenceModulePath = createModulePath("sourceValues.ts");

    const importDecl = sourceFile.getImportDeclarations()[0];
    // import * as values from './sourceValues';

    const result = mapNamespaceImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Verify node
    expect(result.nodes).toHaveLength(1);
    const [namespaceNode] = result.nodes;
    expect(namespaceNode).toMatchObject({
      name: "values",
      type: TypeScriptNodeTypes.NamespaceImport,
      scope: TypeScriptExportValues.Internal,
      status: TypeScriptNodeStatus.Placeholder,
      data: {
        namespaceName: "values",
      },
    });

    // Verify node ID uses full path
    expect(namespaceNode.id).toBe(
      `${referenceModulePath}::namespace-import::values`
    );

    // Verify edge
    expect(result.edges).toHaveLength(1);
    const [edge] = result.edges;
    expect(edge).toMatchObject({
      label: TypeScriptEdgeRelationshipValues.ModuleImportsNamespace,
      source: sourceModuleId,
      target: `${referenceModulePath}::namespace-import::values`,
    });

    // Verify import metadata uses the original module specifier
    expect(result.data.imports).toEqual({
      named: [],
      defaults: [],
      namespaces: [
        {
          modulePath: "./sourceValues",
          alias: "values",
        },
      ],
    });
  });

  it("should correctly map an external namespace import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("externalImports.ts")
    );
    const sourceModuleId = createModuleId("externalImports.ts");
    const importDecl = sourceFile.getImportDeclarations()[3];
    // import * as ReactDOM from 'react-dom';

    const result = mapNamespaceImport(
      sourceModuleId,
      "react-dom::module::react-dom",
      "react-dom",
      importDecl,
      true
    );

    // Verify external namespace node
    expect(result.nodes).toHaveLength(1);
    const [namespaceNode] = result.nodes;
    expect(namespaceNode).toMatchObject({
      name: "ReactDOM",
      type: TypeScriptNodeTypes.NamespaceImport,
      scope: TypeScriptExportValues.External,
      status: TypeScriptNodeStatus.Resolved,
      data: {
        namespaceName: "ReactDOM",
      },
    });

    // Verify edge
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      label: TypeScriptEdgeRelationshipValues.ModuleImportsNamespace,
      source: sourceModuleId,
      target: "react-dom::namespace-import::ReactDOM",
    });

    // Verify import metadata
    expect(result.data.imports.namespaces).toEqual([
      {
        modulePath: "react-dom",
        alias: "ReactDOM",
      },
    ]);
  });

  it("should handle namespace imports with accompanying named imports", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );
    const sourceModuleId = createModuleId("namespaceImports.ts");
    const referenceModuleId = createModuleId("sourceTypes.ts");
    const referenceModulePath = createModulePath("sourceTypes.ts");
    const importDecl = sourceFile.getImportDeclarations()[1];
    // import * as types from './sourceTypes'; import { UserInterface } from './sourceTypes';

    const result = mapNamespaceImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Should only process the namespace import
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({
      name: "types",
      type: TypeScriptNodeTypes.NamespaceImport,
    });

    expect(result.nodes[0].id).toBe(
      `${referenceModulePath}::namespace-import::types`
    );

    expect(result.data.imports.namespaces).toHaveLength(1);
    expect(result.data.imports.namespaces[0]).toEqual({
      modulePath: "./sourceTypes",
      alias: "types",
    });
    expect(result.data.imports.named).toHaveLength(0);
  });

  it("should handle namespace imports with default imports", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );
    const sourceModuleId = createModuleId("namespaceImports.ts");
    const referenceModuleId = createModuleId("sourceValues.ts");
    const referenceModulePath = createModulePath("sourceValues.ts");
    const importDecl = sourceFile.getImportDeclarations()[3];
    // import DefaultClass, * as utils from './sourceValues';

    const result = mapNamespaceImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      importDecl,
      false
    );

    // Should only process the namespace part
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({
      type: TypeScriptNodeTypes.NamespaceImport,
    });

    expect(result.nodes[0].id).toBe(
      `${referenceModulePath}::namespace-import::utils`
    );

    expect(result.data.imports.namespaces).toHaveLength(1);
    expect(result.data.imports.namespaces[0]).toEqual({
      modulePath: "./sourceValues",
      alias: "utils",
    });
    expect(result.data.imports.defaults).toHaveLength(0);
  });

  it("should return empty result for import declaration without namespace import", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );
    const sourceModuleId = createModuleId("namespaceImports.ts");
    const referenceModuleId = createModuleId("sourceTypes.ts");
    const referenceModulePath = createModulePath("sourceTypes.ts");

    const namedOnlyImport = sourceFile
      .getImportDeclarations()
      .find(
        (decl) =>
          !decl.getNamespaceImport() && decl.getNamedImports().length > 0
      );

    if (!namedOnlyImport) {
      throw new Error("Test setup error: couldn't find named-only import");
    }

    const result = mapNamespaceImport(
      sourceModuleId,
      referenceModuleId,
      referenceModulePath,
      namedOnlyImport,
      false
    );

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.data.imports.namespaces).toHaveLength(0);
  });

  it("should handle multiple namespace imports in the same module", () => {
    const sourceFile = project.getSourceFileOrThrow(
      createModulePath("namespaceImports.ts")
    );
    const sourceModuleId = createModuleId("namespaceImports.ts");

    // Get both namespace imports
    const valuesImport = sourceFile.getImportDeclarations()[0]; // import * as values from './sourceValues'
    const typesImport = sourceFile.getImportDeclarations()[1]; // import * as types from './sourceTypes'

    // Map each namespace import
    const valuesResult = mapNamespaceImport(
      sourceModuleId,
      createModuleId("sourceValues.ts"),
      createModulePath("sourceValues.ts"),
      valuesImport,
      false
    );

    const typesResult = mapNamespaceImport(
      sourceModuleId,
      createModuleId("sourceTypes.ts"),
      createModulePath("sourceTypes.ts"),
      typesImport,
      false
    );

    // Each should have its own namespace node
    expect(valuesResult.nodes).toHaveLength(1);
    expect(typesResult.nodes).toHaveLength(1);

    // Verify node IDs use full paths
    expect(valuesResult.nodes[0].id).toBe(
      `${createModulePath("sourceValues.ts")}::namespace-import::values`
    );
    expect(typesResult.nodes[0].id).toBe(
      `${createModulePath("sourceTypes.ts")}::namespace-import::types`
    );

    // Each should have proper edges
    expect(valuesResult.edges).toHaveLength(1);
    expect(typesResult.edges).toHaveLength(1);

    // Each should reference its correct module (with relative paths in metadata)
    expect(valuesResult.data.imports.namespaces[0]).toEqual({
      modulePath: "./sourceValues",
      alias: "values",
    });
    expect(typesResult.data.imports.namespaces[0]).toEqual({
      modulePath: "./sourceTypes",
      alias: "types",
    });
  });
});
