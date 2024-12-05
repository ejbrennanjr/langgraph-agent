import {
  Decorator,
  SourceFile,
  ClassDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
} from "ts-morph";
import {
  EdgeRelationshipType,
  ExportScopeType,
  NodeEntityType,
} from "../enums";
import { GraphInterface } from "../libs/GraphInterface";
import { addEdge } from "../utils/edgeUtils";
import { getExportScope } from "../utils/exportUtils";
import {
  addOrUpdateFileNode,
  addOrUpdateNode,
  generateNestedNodeId,
} from "../utils/nodeUtils";

/**
 * Processes and maps all class declarations within a given TypeScript source file into a graph structure.
 *
 * For each class in the `sourceFile`, the function:
 *  - Resolves any placeholder nodes for the class (or creates a new one if necessary).
 *  - Links class members (methods, properties) and decorators to the class node.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of GraphInterface used to store the nodes and edges representing the class relationships.
 */
export function processClasses(
  sourceFile: SourceFile,
  graph: GraphInterface
): void {
  // Ensure the a file node exists for the source file being passed in
  const fileNodeId = addOrUpdateFileNode(graph, sourceFile);

  sourceFile.getClasses().forEach((cls: ClassDeclaration) => {
    const className = cls.getName();
    if (className) {
      const classNodeId = addOrUpdateNode(
        graph,
        filePath,
        NodeEntityType.Class,
        className,
        getExportScope(cls)
      );

      // Link the class to the file to represent containment
      addEdge(graph, filePath, classNodeId, EdgeRelationshipType.Contains);

      // Process methods, properties, and decorators for the class
      processClassMethods(cls, classNodeId, graph);
      processClassProperties(cls, classNodeId, graph);
      processClassDecorators(classNodeId, cls.getDecorators(), graph);
    }
  });
}

/**
 * Processes each method of a class, adding method nodes to the graph.
 *
 * @param cls - The class declaration to process.
 * @param classNodeId - The unique identifier for the class node in the graph.
 * @param graph - The graph where nodes and edges are stored.
 */
function processClassMethods(
  cls: ClassDeclaration,
  classNodeId: string,
  graph: GraphInterface
): void {
  cls.getMethods().forEach((method: MethodDeclaration) => {
    const methodName = method.getName();
    const methodNodeId = generateNestedNodeId(
      NodeEntityType.Method,
      methodName,
      classNodeId
    );

    // Create or update the method node in the graph
    addOrUpdateNode(
      graph,
      classNodeId,
      NodeEntityType.Method,
      methodName,
      ExportScopeType.Internal,
      {
        visibility:
          method
            .getModifiers()
            .find((mod) =>
              ["public", "protected", "private"].includes(mod.getText())
            ) || "public",
        isStatic: method.isStatic(),
        isAsync: method.isAsync(),
        parameters: method.getParameters().map((param) => param.getName()),
        returnType: method.getReturnType().getText(),
      }
    );

    // Link the method to the class node
    addEdge(graph, classNodeId, methodNodeId, EdgeRelationshipType.Contains);

    // Process decorators for the method
    processClassDecorators(methodNodeId, method.getDecorators(), graph);
  });
}

/**
 * Processes each property of a class, adding property nodes to the graph.
 *
 * @param cls - The class declaration to process.
 * @param classNodeId - The unique identifier for the class node in the graph.
 * @param graph - The graph where nodes and edges are stored.
 */
function processClassProperties(
  cls: ClassDeclaration,
  classNodeId: string,
  graph: GraphInterface
): void {
  cls.getProperties().forEach((property: PropertyDeclaration) => {
    const propertyName = property.getName();
    const propertyNodeId = generateNestedNodeId(
      NodeEntityType.Property,
      propertyName,
      classNodeId
    );

    // Create or update the property node in the graph
    addOrUpdateNode(
      graph,
      classNodeId,
      NodeEntityType.Property,
      propertyName,
      ExportScopeType.Internal,
      {
        visibility:
          property
            .getModifiers()
            .find((mod) =>
              ["public", "protected", "private"].includes(mod.getText())
            ) || "public",
        isStatic: property.isStatic(),
        isReadOnly: property.isReadonly(),
        propertyType: property.getType().getText(),
      }
    );

    // Link the property to the class node
    addEdge(graph, classNodeId, propertyNodeId, EdgeRelationshipType.Contains);

    // Process decorators for the property
    processClassDecorators(propertyNodeId, property.getDecorators(), graph);
  });
}

/**
 * Processes a decorator, creating a node for it in the graph.
 *
 * @param entityNodeId - The ID of the entity node being decorated.
 * @param decorators - The list of decorators applied to the entity.
 * @param graph - The graph where nodes and edges are stored.
 */
function processClassDecorators(
  entityNodeId: string,
  decorators: Decorator[],
  graph: GraphInterface
): void {
  decorators.forEach((decorator) => {
    const decoratorName = decorator.getName();
    const decoratorNodeId = addOrUpdateNode(
      graph,
      "unresolved",
      NodeEntityType.Decorator,
      decoratorName,
      ExportScopeType.Internal
    );

    // Link the entity node to the decorator node
    addEdge(
      graph,
      entityNodeId,
      decoratorNodeId,
      EdgeRelationshipType.DecoratedBy
    );

    // If the decorator is defined in an external module, create an edge to that module
    const decoratorFilePath = decorator
      .getExpression()
      .getSourceFile()
      ?.getFilePath();
    if (decoratorFilePath) {
      addEdge(
        graph,
        decoratorNodeId,
        decoratorFilePath,
        EdgeRelationshipType.DefinedIn
      );
    }
  });
}
