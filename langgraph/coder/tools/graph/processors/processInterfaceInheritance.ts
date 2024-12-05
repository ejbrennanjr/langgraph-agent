import { InterfaceDeclaration } from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes the inheritance relationships for an interface and adds them to the graph.
 *
 * If the interface extends other interfaces, edges are created to represent the "extends" relationship.
 *
 * @param interfaceDecl - The interface declaration to process.
 * @param interfaceNodeId - The unique identifier for the interface node in the graph.
 * @param filePath - The file path of the current source file, used to identify nodes.
 * @param graph - The graph where nodes and edges are stored.
 */
export function processInterfaceInheritance(
  interfaceDecl: InterfaceDeclaration,
  interfaceNodeId: string,
  filePath: string,
  graph: Graph
): void {
  interfaceDecl.getExtends().forEach((extendedInterface) => {
    const extendedInterfaceName = extendedInterface.getExpression().getText();
    const extendedInterfaceSourceFile = extendedInterface
      .getExpression()
      .getSourceFile();
    const extendedInterfaceFilePath = extendedInterfaceSourceFile
      ? extendedInterfaceSourceFile.getFilePath()
      : null;

    const extendedInterfaceNodeId = extendedInterfaceFilePath
      ? `${extendedInterfaceFilePath}#interface#${extendedInterfaceName}`
      : `unresolved#interface#${extendedInterfaceName}`;

    // Add a placeholder node if the interface hasn't been added yet
    if (!graph.hasNode(extendedInterfaceNodeId)) {
      graph.setNode(extendedInterfaceNodeId, {
        type: "interface",
        name: extendedInterfaceName,
        isPlaceholder: true,
      });
    }

    graph.setEdge(interfaceNodeId, extendedInterfaceNodeId, {
      type: "extends",
    });
  });
}
