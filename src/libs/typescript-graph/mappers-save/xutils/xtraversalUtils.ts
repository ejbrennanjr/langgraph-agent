/**
 * @fileoverview Utilities for traversing and creating TypeScript entities in the graph
 */

import { Node as TSMorphNode, SourceFile } from "ts-morph";
import { z, ZodType } from "zod";

import { Graph } from "@/domain/repositories/Graph";
import { generateNodeId } from "@/libs/typescript-graph/mappers/xutils/xtypescriptNodeId";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/xutils/xtypescriptEdgeId";
import {
  TypeScriptNodeTypes,
  TypeScriptNodeStatus,
  TypeScriptNodeSchema,
  TypeScriptNode,
  SourceLocation,
} from "@/domain/entities/graph/typescript/TypeScriptNode";
import {
  createTypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/domain/entities/graph/typescript/TypeScriptEdge";
import { TypeScriptExportValues } from "@/domain/entities/graph/typescript/TypeScriptFoundations";

/**
 * A utility function that retrieves an existing node from the graph or creates a new one if not found.
 * Assumes that all nodes in the graph already have the required key properties.
 *
 * @template T - The Zod schema type for the node data.
 * @template R - The specific TypeScript node type that extends TypeScriptNode.
 *
 * @param graph - Graph instance to store nodes
 * @param nodeId - Unique identifier for the node
 * @param entityName - Name of the entity
 * @param entityScope - Export scope of the entity
 * @param createEntityNodeFn - Factory function to create the node
 * @param schema - Zod schema for node validation
 * @param status - Node resolution status
 * @param location - Source code location information
 *
 * * @returns {R} - The specific type of node retrieved or created (e.g., ClassNode, InterfaceNode).
 */
export const getOrCreateNode = <
  T extends z.ZodTypeAny,
  R extends TypeScriptNode<z.infer<T>>
>(
  graph: Graph,
  nodeId: string,
  entityName: string,
  entityScope: TypeScriptExportValues,
  createEntityNodeFn: (
    id: string,
    name: string,
    scope: TypeScriptExportValues,
    status: TypeScriptNodeStatus,
    location: SourceLocation,
    options?: any
  ) => R,
  entitySchema: T,
  status: TypeScriptNodeStatus,
  location: SourceLocation
): R => {
  // Check if node exists in graph
  const existingNode = graph.getNode<typeof entitySchema>(nodeId) as R;
  if (existingNode) {
    return existingNode;
  }

  // If node does not exist, create a new one using the provided factory function
  const newNode = createEntityNodeFn(
    nodeId,
    entityName,
    entityScope,
    status,
    location
  );

  // Add to graph with validation
  graph.addNode(newNode, entitySchema);

  // Return the newly created node
  return newNode;
};

/**
 * Utility function to retrieve the source location of a TypeScript node.
 *
 * @param sourceFile - The source file containing the node
 * @param startPos - Optional start position for the entity (defaults to start of file for modules)
 * @param endPos - Optional end position for the entity (defaults to end of file for modules)
 * @returns SourceLocation object with file path, start line, start column, end line, and end column
 */
export const getSourceLocation = (
  sourceFile: SourceFile,
  startPos: number = 0,
  endPos: number = sourceFile.getEnd()
): SourceLocation => {
  const startLineAndColumn = sourceFile.getLineAndColumnAtPos(startPos);
  const endLineAndColumn = sourceFile.getLineAndColumnAtPos(endPos);

  return {
    filePath: sourceFile.getFilePath(),
    startLine: startLineAndColumn.line,
    startColumn: startLineAndColumn.column,
    endLine: endLineAndColumn.line,
    endColumn: endLineAndColumn.column,
  };
};

/**
 * traverseInternalEntities
 *
 * Processes and creates nodes for internal entities within a TypeScript parent entity.
 * This function is entity-agnostic and can handle any type of TypeScriptNode entity (classes, functions, etc.).
 * It creates placeholder nodes for each internal entity and establishes the relationship with its parent.
 *
 * @template T - The Zod schema type for the node data.
 * @template R - The specific TypeScript node type that extends TypeScriptNode.
 * @param graph - Graph instance to store nodes
 * @param internalEntities - Array of ts-morph nodes to process
 * @param parentId - ID of the parent node
 * @param entityType - Type of entities being processed
 * @param scope - Export scope for the entities
 * @param createEntityNodeFn - Factory function to create the nodes
 * @param schema - Zod schema for node validation
 * @param location - Source code location information
 *
 * @returns {R[]} - Array of processed entity nodes.
 */
export const traverseInternalEntities = <
  T extends z.ZodTypeAny,
  R extends TypeScriptNode<z.infer<T>>
>(
  graph: Graph,
  internalEntities: TSMorphNode[],
  parentId: string,
  entityType: TypeScriptNodeTypes,
  scope: TypeScriptExportValues,
  createEntityNodeFn: (
    id: string,
    name: string,
    scope: TypeScriptExportValues,
    status: TypeScriptNodeStatus,
    location: SourceLocation,
    options?: any
  ) => R,
  entitySchema: T,
  location: SourceLocation
): R[] => {
  return internalEntities.map((entity) => {
    // Get the entity name, defaulting to "unnamed" if getName() is not available
    const entityName =
      "getName" in entity && typeof entity.getName === "function"
        ? entity.getName()
        : "unnamed";

    // Generate unique ID for the entity
    const entityId = generateNodeId(parentId, entityType, entityName);

    // Create or get the entity node
    const node = getOrCreateNode(
      graph,
      entityId,
      entityName,
      scope,
      createEntityNodeFn,
      entitySchema,
      TypeScriptNodeStatus.Placeholder,
      location
    );

    // Create relationship with parent
    const edge = createTypeScriptEdge(
      generateEdgeId(
        entityId,
        parentId,
        TypeScriptEdgeRelationshipValues.DefinedIn
      ),
      entityId,
      parentId,
      TypeScriptEdgeRelationshipValues.DefinedIn
    );
    graph.addEdge(edge);

    return node;
  });
};
