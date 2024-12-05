import { SourceFile, EnumDeclaration, EnumMember } from "ts-morph";
import { GraphInterface } from "../libs/GraphInterface"; // Update path based on your structure
import { generateNodeId, addNode } from "../utils/nodeUtils";
import { addEdge, EdgeType } from "../utils/edgeUtils";
import { getExportScope } from "../utils/exportUtils";

/**
 * Processes and maps all enum declarations within a given TypeScript source file into a graph structure.
 *
 * For each enum in the `sourceFile`, the function:
 *  - Creates a unique node in the `graph` representing the enum.
 *  - Iterates over the enum members, creating individual nodes for each member.
 *  - Adds edges linking the enum node to each member node, representing the "contains" relationship.
 *
 * ### Explanation of Enums
 * Enums in TypeScript represent a set of named constants. Each member of an enum can be assigned a value
 * (either a numeric or string literal) or can automatically receive a numeric value based on its position.
 * - Numeric Enums: By default, TypeScript assigns numeric values starting at 0 for the first member and increments by 1 for each subsequent member.
 * - String Enums: If members are explicitly assigned string values, the enum is known as a string enum.
 *
 * This structure allows the graph to represent both the enum itself and each member's value, making it possible to visualize
 * relationships between enums and other parts of the codebase.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the enum relationships.
 */
export function processEnums(
  sourceFile: SourceFile,
  graph: GraphInterface
): void {
  const filePath = sourceFile.getFilePath();

  // Retrieve all enum declarations in the source file
  sourceFile.getEnums().forEach((enumDecl: EnumDeclaration) => {
    const enumName = enumDecl.getName();
    const enumNodeId = generateNodeId("enum", enumName, filePath);

    const scope = getExportScope(enumDecl);

    // Add the enum node to the graph, indicating it represents an "enum"
    addNode(graph, enumNodeId, "enum", enumName, scope);

    // Link the enum to the file to represent containment
    addEdge(graph, filePath, enumNodeId, EdgeType.Contains);

    // Process each member of the enum
    enumDecl.getMembers().forEach((member: EnumMember) => {
      const memberName = member.getName();
      const memberValue = member.getValue();
      const memberNodeId = generateNodeId(
        "enum member",
        memberName,
        enumNodeId
      );

      // Add the enum member node to the graph, including its value if available
      addNode(graph, memberNodeId, "enum member", memberName, "internal", {
        value: memberValue,
      });

      // Link the member to the enum with a "contains" edge
      addEdge(graph, enumNodeId, memberNodeId, EdgeType.Contains);
    });
  });
}
