import { SourceFile, ImportDeclaration, ImportSpecifier } from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes and maps all external import statements from a given TypeScript source file into a graph structure.
 *
 * This function specifically handles external imports (those with unresolved file paths) and:
 *  - Creates nodes for external modules if they do not already exist.
 *  - Adds edges linking the current file path to each imported entity, with appropriate aliases if used.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing external import relationships.
 */
export function processExternalDependencies(
  sourceFile: SourceFile,
  graph: Graph
): void {
  const filePath: string = sourceFile.getFilePath();

  sourceFile
    .getImportDeclarations()
    .forEach((importDecl: ImportDeclaration) => {
      const moduleSpecifier: string = importDecl.getModuleSpecifierValue();
      const resolvedSourceFile = importDecl.getModuleSpecifierSourceFile();

      if (!resolvedSourceFile) {
        const externalModuleNodeId = `external#${moduleSpecifier}`;
        if (!graph.hasNode(externalModuleNodeId)) {
          graph.setNode(externalModuleNodeId, {
            type: "external module",
            name: moduleSpecifier,
          });
        }

        processExternalDefaultImport(
          importDecl,
          externalModuleNodeId,
          filePath,
          graph
        );
        processExternalNamedImports(
          importDecl,
          externalModuleNodeId,
          filePath,
          graph
        );
        processExternalNamespaceImport(
          importDecl,
          externalModuleNodeId,
          filePath,
          graph
        );
      }
    });
}

/**
 * Processes default imports from external modules, creating a node for the specific entity and linking it to the module.
 *
 * @param importDecl - The import declaration to process.
 * @param externalModuleNodeId - The ID of the external module node.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processExternalDefaultImport(
  importDecl: ImportDeclaration,
  externalModuleNodeId: string,
  filePath: string,
  graph: Graph
): void {
  const defaultImport = importDecl.getDefaultImport();
  if (defaultImport) {
    const importName = defaultImport.getText();
    const defaultImportNodeId = `${externalModuleNodeId}#${importName}`;

    if (!graph.hasNode(defaultImportNodeId)) {
      graph.setNode(defaultImportNodeId, {
        type: "external entity",
        name: importName,
        importType: "default",
      });
      graph.setEdge(defaultImportNodeId, externalModuleNodeId, {
        type: "belongs to module",
      });
    }

    graph.setEdge(filePath, defaultImportNodeId, { type: "imports default" });
  }
}

/**
 * Processes named imports from external modules, creating nodes for each imported entity and linking them to the module.
 *
 * @param importDecl - The import declaration to process.
 * @param externalModuleNodeId - The ID of the external module node.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processExternalNamedImports(
  importDecl: ImportDeclaration,
  externalModuleNodeId: string,
  filePath: string,
  graph: Graph
): void {
  importDecl.getNamedImports().forEach((namedImport: ImportSpecifier) => {
    const importName = namedImport.getName();
    const alias = namedImport.getAliasNode()?.getText();
    const namedImportNodeId = `${externalModuleNodeId}#${importName}`;

    if (!graph.hasNode(namedImportNodeId)) {
      graph.setNode(namedImportNodeId, {
        type: "external entity",
        name: importName,
        importType: "named",
      });
      graph.setEdge(namedImportNodeId, externalModuleNodeId, {
        type: "belongs to module",
      });
    }

    const edgeAttributes = alias
      ? { type: "imports named", alias }
      : { type: "imports named" };
    graph.setEdge(filePath, namedImportNodeId, edgeAttributes);
    // If an alias exists, create an alias node and link it to the original import
    if (alias) {
      const aliasNodeId = `${filePath}#alias#${alias}`;
      graph.setNode(aliasNodeId, {
        type: "alias",
        originalName: importName,
        alias,
      });
      graph.setEdge(aliasNodeId, namedImportNodeId, { type: "alias of" });
    }
  });
}

/**
 * Processes namespace imports from external modules, linking the module as a whole to the importing file.
 *
 * @param importDecl - The import declaration to process.
 * @param externalModuleNodeId - The ID of the external module node.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processExternalNamespaceImport(
  importDecl: ImportDeclaration,
  externalModuleNodeId: string,
  filePath: string,
  graph: Graph
): void {
  const namespaceImport = importDecl.getNamespaceImport();
  if (namespaceImport) {
    const alias = namespaceImport.getText();
    graph.setEdge(filePath, externalModuleNodeId, {
      type: "imports namespace",
      alias,
    });
  }
}
