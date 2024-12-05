import {
  SourceFile,
  InterfaceDeclaration,
  MethodSignature,
  PropertySignature,
} from "ts-morph";
import { GraphInterface } from "../libs/GraphInterface";
import {
  generateNodeId,
  generateUnresolvedNodeId,
  addNode,
  NodeMetadata,
} from "../utils/nodeUtils";
import { addEdge, EdgeMetadata, EdgeType } from "../utils/edgeUtils";
import { getExportScope } from "../utils/exportUtils";

/**
 * Processes and maps all interface declarations within a given TypeScript source file into a graph structure.
 *
 * For each interface in the `sourceFile`, the function:
 *  - Checks if a placeholder node for the interface exists. If it does, updates the placeholder with full interface details.
 *  - If not, creates a unique node in the `graph` representing the interface.
 *  - Calls helper functions to handle interface members (methods and properties).
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the interface relationships.
 */
export function processInterfaces(
  sourceFile: SourceFile,
  graph: GraphInterface
): void {
  const filePath = sourceFile.getFilePath();

  sourceFile.getInterfaces().forEach((interfaceDecl: InterfaceDeclaration) => {
    const interfaceName = interfaceDecl.getName();
    if (interfaceName) {
      const interfaceNodeId = generateNodeId(
        "interface",
        interfaceName,
        filePath
      );

      const unresolvedNodeId = generateUnresolvedNodeId(
        "interface",
        interfaceName
      );

      const scope = getExportScope(interfaceDecl);

      const existingNode = graph.node(interfaceNodeId) as
        | NodeMetadata
        | undefined;
      // Scenario 1: Placeholder with Known Path
      if (existingNode?.isPlaceholder) {
        addNode(graph, interfaceNodeId, "interface", interfaceName, scope);
      }
      // Scenario 2: Generic Placeholder without Known Path
      else if (graph.hasNode(unresolvedNodeId)) {
        const unresolvedNode = graph.node(unresolvedNodeId) as NodeMetadata;

        graph.predecessors(unresolvedNodeId)?.forEach((pred: string) => {
          const edgeData = graph.edge(pred, unresolvedNodeId) as
            | EdgeMetadata
            | undefined;
          if (edgeData) {
            addEdge(graph, pred, interfaceNodeId, edgeData.type);
          }
        });
        graph.successors(unresolvedNodeId)?.forEach((succ: string) => {
          const edgeData = graph.edge(unresolvedNodeId, succ) as
            | EdgeMetadata
            | undefined;
          if (edgeData) {
            addEdge(graph, interfaceNodeId, succ, edgeData.type);
          }
        });

        addNode(graph, interfaceNodeId, "interface", interfaceName, scope);
        graph.removeNode(unresolvedNodeId);
      }
      // Scenario 3: New Interface
      else {
        addNode(graph, interfaceNodeId, "interface", interfaceName, scope);
      }

      // Link the interface to the file to represent containment
      addEdge(graph, filePath, interfaceNodeId, EdgeType.Contains);

      // Process methods and properties for the interface
      processInterfaceMethods(interfaceDecl, interfaceNodeId, graph);
      processInterfaceProperties(interfaceDecl, interfaceNodeId, graph);
    }
  });
}

/**
 * Processes the methods of an interface, adding method nodes to the graph.
 *
 * For each method:
 *  - Captures metadata such as name and return type.
 *  - Links the method to the interface with a "contains" edge.
 *
 * @param interfaceDecl - The interface declaration to process.
 * @param interfaceNodeId - The unique identifier for the interface node in the graph.
 * @param graph - The graph where nodes and edges are stored.
 */
function processInterfaceMethods(
  interfaceDecl: InterfaceDeclaration,
  interfaceNodeId: string,
  graph: GraphInterface
): void {
  interfaceDecl.getMethods().forEach((method: MethodSignature) => {
    const methodName = method.getName();
    const methodNodeId = generateNodeId("method", methodName, interfaceNodeId);

    addNode(graph, methodNodeId, "method", methodName, "internal", {
      returnType: method.getReturnType().getText(),
    });
    addEdge(graph, interfaceNodeId, methodNodeId, EdgeType.Contains);
  });
}

/**
 * Processes the properties of an interface, adding property nodes to the graph.
 *
 * For each property:
 *  - Captures metadata such as name and type.
 *  - Links the property to the interface with a "contains" edge.
 *
 * @param interfaceDecl - The interface declaration to process.
 * @param interfaceNodeId - The unique identifier for the interface node in the graph.
 * @param graph - The graph where nodes and edges are stored.
 */
function processInterfaceProperties(
  interfaceDecl: InterfaceDeclaration,
  interfaceNodeId: string,
  graph: GraphInterface
): void {
  interfaceDecl.getProperties().forEach((property: PropertySignature) => {
    const propertyName = property.getName();
    const propertyNodeId = generateNodeId(
      "property",
      propertyName,
      interfaceNodeId
    );

    addNode(graph, propertyNodeId, "property", propertyName, "internal", {
      propertyType: property.getType().getText(),
    });
    addEdge(graph, interfaceNodeId, propertyNodeId, EdgeType.Contains);
  });
}
