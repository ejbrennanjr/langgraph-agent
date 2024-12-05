import {
  SourceFile,
  TypeAliasDeclaration,
  TypeNode,
  SyntaxKind,
  PropertySignature,
} from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes and maps all type alias declarations within a given TypeScript source file into a graph structure.
 *
 * For each type alias in the `sourceFile`, the function:
 *  - Creates a unique node in the `graph` representing the type.
 *  - Calls helper functions to handle type members (properties) if the type alias represents a type literal.
 *
 * ### Explanation of SyntaxKind
 * `SyntaxKind` is an enumeration provided by the TypeScript compiler API that represents all possible syntactic elements
 * in TypeScript code. Every construct in TypeScript—such as classes, functions, variables, and keywords—has a unique
 * `SyntaxKind` identifier. In this function, `SyntaxKind` is essential for distinguishing between the different forms
 * a type alias can take.
 *
 * Since a type alias can represent a variety of types (e.g., a union, intersection, or type literal), `SyntaxKind`
 * helps us confirm that a type alias node is a `TypeLiteral` before processing its members. Without this check,
 * the function might incorrectly attempt to process nodes that don’t have properties, leading to errors.
 *
 * ### Explanation of Type Literals
 * In TypeScript, a **type literal** represents an anonymous type with specific properties, resembling an interface.
 * - For example: `type MyType = { prop1: string; prop2: number; }`
 *   - This type literal has two properties: `prop1` and `prop2`.
 * - This function detects type literals using `SyntaxKind` and processes their members in a manner similar to an
 *   interface declaration.
 *
 * This structure allows the graph to accurately represent both standalone type aliases and complex type literals.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the type relationships.
 */
export function processTypes(sourceFile: SourceFile, graph: Graph): void {
  const filePath = sourceFile.getFilePath();

  // Retrieve all type alias declarations in the source file
  sourceFile.getTypeAliases().forEach((typeAlias: TypeAliasDeclaration) => {
    const typeName = typeAlias.getName();
    const isExported = typeAlias.isExported();
    const isDefaultExport = typeAlias.isDefaultExport();
    const typeNodeId = `${filePath}#type#${typeName}`;

    const scope = isDefaultExport
      ? "default export"
      : isExported
      ? "named export"
      : "internal";

    // Add the type node to the graph, indicating it represents a "type"
    graph.setNode(typeNodeId, {
      type: "type",
      name: typeName,
      scope,
    });

    // Link the type to the file to represent containment
    graph.setEdge(filePath, typeNodeId, { type: "contains" });

    // Process the type's underlying type definition
    const typeNode = typeAlias.getTypeNode();

    // Use SyntaxKind to check if the type alias is a type literal
    // SyntaxKind.TypeLiteral identifies anonymous object types (e.g., type MyType = { prop1: string; })
    if (typeNode && typeNode.getKind() === SyntaxKind.TypeLiteral) {
      processTypeLiteralMembers(typeNode as TypeNode, typeNodeId, graph);
    }
  });
}

/**
 * Processes the properties of a type literal and adds them to the graph.
 *
 * For each property in the type literal, a node is created and linked to the type node, showing a "contains" relationship.
 *
 * @param typeLiteralNode - The TypeLiteralNode representing the type literal to process.
 * @param typeNodeId - The unique identifier for the type node in the graph.
 * @param graph - The graph where nodes and edges are stored.
 */
function processTypeLiteralMembers(
  typeLiteralNode: TypeNode,
  typeNodeId: string,
  graph: Graph
): void {
  // Using SyntaxKind here allows us to verify the type literal structure before accessing its members
  if (typeLiteralNode.getKind() === SyntaxKind.TypeLiteral) {
    // Cast typeNode to access its properties
    const members = (typeLiteralNode as any).getMembers();

    members.forEach((property: PropertySignature) => {
      const propertyName = property.getName();
      const propertyNodeId = `${typeNodeId}#property#${propertyName}`;
      const propertyType = property.getType().getText();

      // Add a node for the property, capturing its type
      graph.setNode(propertyNodeId, {
        type: "property",
        name: propertyName,
        propertyType: propertyType,
      });

      // Link the property to the type with a "contains" edge
      graph.setEdge(typeNodeId, propertyNodeId, { type: "contains" });
    });
  }
}
