import { ClassDeclaration } from "ts-morph";
import { Graph } from "graphlib";

/**
 * Processes the inheritance relationship for a class and adds it to the graph.
 *
 * If the class extends another class, the function:
 *  - Attempts to resolve the superclass module or file path.
 *  - If the superclass file is found, creates a node with the correct file path and adds an "extends" edge.
 *  - If the superclass file cannot be resolved, creates a generic placeholder node.
 *
 * @param cls - The class declaration to process.
 * @param classNodeId - The unique identifier for the class node in the graph.
 * @param filePath - The file path of the current source file, used to identify nodes.
 * @param graph - The graph where nodes and edges are stored.
 */
export function processClassInheritance(
  cls: ClassDeclaration,
  classNodeId: string,
  filePath: string,
  graph: Graph
): void {
  const extendsClause = cls.getExtends();
  if (extendsClause) {
    const superClassName = extendsClause.getExpression().getText();
    const superClassSourceFile = extendsClause.getExpression().getSourceFile();
    const superClassFilePath = superClassSourceFile
      ? superClassSourceFile.getFilePath()
      : null;
    const superClassNodeId = superClassFilePath
      ? `${superClassFilePath}#class#${superClassName}`
      : `unresolved#class#${superClassName}`;

    if (!graph.hasNode(superClassNodeId)) {
      graph.setNode(superClassNodeId, {
        type: "class",
        name: superClassName,
        isPlaceholder: true,
      });
    }

    graph.setEdge(classNodeId, superClassNodeId, { type: "extends" });
  }
}
