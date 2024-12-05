import { SourceFile, ImportDeclaration, ImportSpecifier } from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes and maps all import statements from a given TypeScript source file into a graph structure,
 * referencing only exported nodes for imported entities where possible, using consistent naming conventions.
 *
 * For each import in the `sourceFile`, the function:
 *  - Checks if a node for the imported entity already exists in the graph as an exported entity.
 *  - Adds edges linking the current file path to the existing exported node for each imported entity, denoting an "imports" relationship.
 *  - Handles default, named, and namespace imports, creating dependency edges directly to pre-existing nodes 
 *  - Tracks aliases (using the `as` keyword) to show when an imported entity is used under a different name.
 *
 * This structure allows the graph to accurately represent file-level dependencies by referencing existing exported nodes for each imported entity.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the import relationships.
 */
export function processImports(sourceFile: SourceFile, graph: Graph): void {
  const filePath: string = sourceFile.getFilePath();

  sourceFile
    .getImportDeclarations()
    .forEach((importDecl: ImportDeclaration) => {
      const moduleSpecifier: string = importDecl.getModuleSpecifierValue();
      const resolvedSourceFile = importDecl.getModuleSpecifierSourceFile();

      if (resolvedSourceFile) {
        const importedFilePath: string = resolvedSourceFile.getFilePath();

        // Handle internal imports
        processDefaultImport(importDecl, importedFilePath, filePath, graph);
        processNamedImports(importDecl, importedFilePath, filePath, graph);
        processNamespaceImport(importDecl, importedFilePath, filePath, graph);
      } 
    });
}

/**
 * Processes default imports from internal modules, linking them to the appropriate node if it exists.
 *
 * @param importDecl - The import declaration to process.
 * @param importedFilePath - The file path of the imported module.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processDefaultImport(
  importDecl: ImportDeclaration,
  importedFilePath: string,
  filePath: string,
  graph: Graph
): void {
  const defaultImport = importDecl.getDefaultImport();
  if (defaultImport) {
    const importName = defaultImport.getText();
    const potentialDefaultNodes = [
      `${importedFilePath}#class#${importName}`,
      `${importedFilePath}#function#${importName}`,
      `${importedFilePath}#variable#${importName}`,
      `${importedFilePath}#enum#${importName}`,
      `${importedFilePath}#interface#${importName}`,
      `${importedFilePath}#type#${importName}`,
    ];

    for (const nodeId of potentialDefaultNodes) {
      const node = graph.node(nodeId);
      if (node && node.scope === "default export") {
        graph.setEdge(filePath, nodeId, { type: "imports default" });
        break;
      }
    }
  }
}

/**
 * Processes named imports from internal modules, linking them to the corresponding nodes in the graph.
 * This function also detects and tracks aliases for named imports using the `as` keyword.
 *
 * @param importDecl - The import declaration to process.
 * @param importedFilePath - The file path of the imported module.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processNamedImports(
  importDecl: ImportDeclaration,
  importedFilePath: string,
  filePath: string,
  graph: Graph
): void {
  importDecl.getNamedImports().forEach((namedImport: ImportSpecifier) => {
    const name = namedImport.getName();
    const alias = namedImport.getAliasNode()?.getText(); // Detect alias if present
    const possibleNodeIds = [
      `${importedFilePath}#class#${name}`,
      `${importedFilePath}#function#${name}`,
      `${importedFilePath}#variable#${name}`,
      `${importedFilePath}#enum#${name}`,
      `${importedFilePath}#interface#${name}`,
      `${importedFilePath}#type#${name}`,
    ];

    for (const nodeId of possibleNodeIds) {
      const node = graph.node(nodeId);
      if (node && node.scope === "named export") {
        // Track the alias if it exists
        const edgeAttributes = alias
          ? { type: "imports named", alias }
          : { type: "imports named" };
        graph.setEdge(filePath, nodeId, edgeAttributes);

        // If alias is present, create a node to represent the alias relationship
        if (alias) {
          const aliasNodeId = `${filePath}#alias#${alias}`;
          graph.setNode(aliasNodeId, {
            type: "alias",
            originalName: name,
            alias,
          });
          graph.setEdge(aliasNodeId, nodeId, { type: "alias of" });
        }
        break;
      }
    }
  });
}

/**
 * Processes namespace imports (e.g., `import * as ns from "module"`) by creating a module-level dependency.
 *
 * @param importDecl - The import declaration to process.
 * @param importedFilePath - The file path of the imported module.
 * @param filePath - The path of the importing file.
 * @param graph - The graph instance.
 */
function processNamespaceImport(
  importDecl: ImportDeclaration,
  importedFilePath: string,
  filePath: string,
  graph: Graph
): void {
  const namespaceImport = importDecl.getNamespaceImport();
  if (namespaceImport) {
    const alias = namespaceImport.getText();
    graph.setEdge(filePath, importedFilePath, {
      type: "imports namespace",
      alias,
    });
  }
}

/