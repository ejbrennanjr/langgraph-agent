import { ClassDeclaration } from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes interface implementations for a class and adds them to the graph.
 *
 * If the class implements any interfaces, edges are created to represent the "implements" relationship.
 *  - If an interface node doesn't exist, creates a placeholder node with a known path or a generic `unresolved` node.
 *  - Once the node exists (as a full or placeholder node), creates an "implements" edge from the class to the interface.
 *
 * @param cls - The class declaration to process.
 * @param classNodeId - The unique identifier for the class node in the graph.
 * @param filePath - The file path of the current source file, used to identify nodes.
 * @param graph - The graph where nodes and edges are stored.
 */
export function processInterfaceImplementations(
  cls: ClassDeclaration,
  classNodeId: string,
  filePath: string,
  graph: Graph
): void {
  cls.getImplements().forEach((impl) => {
    const interfaceName = impl.getExpression().getText();
    const interfaceSourceFile = impl.getExpression().getSourceFile();
    const interfaceFilePath = interfaceSourceFile
      ? interfaceSourceFile.getFilePath()
      : null;
    const interfaceNodeId = interfaceFilePath
      ? `${interfaceFilePath}#interface#${interfaceName}`
      : `unresolved#interface#${interfaceName}`;

    if (!graph.hasNode(interfaceNodeId)) {
      graph.setNode(interfaceNodeId, {
        type: "interface",
        name: interfaceName,
        isPlaceholder: true,
      });
    }

    graph.setEdge(classNodeId, interfaceNodeId, { type: "implements" });
  });
}
