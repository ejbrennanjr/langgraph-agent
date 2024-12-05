import { z } from "zod";

import { GraphInterface } from "../libs/GraphInterface";
import { SourceFile } from "ts-morph";
import { ExportScopeType, FilePathType, NodeEntityType } from "../enums";
import { ClassNodeSchema, BaseNode, FileNode, FileNodeSchema } from "../types";
import { getResolvedFilePath } from "./fileUtils";
import { isValidNodeType } from "./typeGuards";

/**
 * Adds or updates a file node in the graph. If the file path is unresolved, it creates
 * an unresolved placeholder node. This utility centralizes file node creation for all processors.
 *
 * @param graph - The graph instance where nodes and edges are stored.
 * @param sourceFile - The SourceFile object representing the file to process.
 * @returns The FileNode object that was added or updated.
 */
export function addOrUpdateFileNode(
  graph: GraphInterface,
  sourceFile: SourceFile
): FileNode {
  const filePath = getResolvedFilePath(sourceFile); // Resolve file path or fallback to "unresolved"

  // Add or update the file node, marking it as a placeholder if unresolved
  return addOrUpdateNode<FileNode>(
    graph,
    filePath,
    NodeEntityType.File,
    filePath, // Use file path as the name
    ExportScopeType.Internal, // File node is typically "internal"
    {}, // No additional metadata needed
    FileNodeSchema, // Validate against FileNode schema
    filePath === "unresolved" // Mark as placeholder if unresolved
  );
}

/**
 * Adds or updates a node in the graph. If the node already exists and is a placeholder, it is resolved.
 * This function handles three scenarios:
 *  - New Node: Creates the node with the given metadata.
 *  - Unresolved Placeholder: Resolves the placeholder node with full metadata and transfers edges.
 *  - Resolved ID but Incomplete Metadata: Updates the existing node directly without transferring edges.
 * The function returns the full node object of the appropriate type.
 *
 * @param graph - The graph instance implementing GraphInterface.
 * @param entityFilePath - The file path where the node is located. Used to generate resolved node IDs. Defaults to "unresolved" if not provided.
 * @param entityType - The type of the node (e.g., "class", "method").
 * @param entityName - The name of the node.
 * @param entityScope - The export scope of the node (e.g., "internal", "default export").
 * @param entityMetadata - Additional properties specific to the entity type.
 * @param entityValidationSchema - The Zod schema for the specific node type.
 * @param isPlaceholder - Boolean indicating if the node should initially be a placeholder.
 * @returns The complete node object of the specific type.
 */
export function addOrUpdateNode<T extends BaseNode>(
  graph: GraphInterface,
  entityFilePath: string,
  entityType: NodeEntityType,
  entityName: string,
  entityScope: ExportScopeType,
  entityMetadata: Record<string, any> = {},
  entityValidationSchema: z.ZodSchema<T>, // The schema for validating the node type
  isPlaceholder = false
): T {
  // Generate a unique node ID based on filePath, type, and name
  const nodeId = generateNodeId(entityFilePath, entityType, entityName);

  if (isNode(graph, nodeId)) {
    const existingNode = graph.node(nodeId) as BaseNode;

    // Scenario 1: Unresolved Placeholder
    if (
      existingNode.isPlaceholder &&
      existingNode.name.startsWith("unresolved")
    ) {
      if (entityFilePath === "unresolved") {
        // Update the unresolved placeholder metadata
        const updatedMetadata = mergeNodeMetadata(
          existingNode,
          entityMetadata,
          true
        );
        graph.setNode(nodeId, updatedMetadata);
        return schema.parse(updatedMetadata); // Return updated placeholder
      }

      // Resolve the placeholder
      const resolvedNodeId = generateNodeId(
        entityFilePath,
        entityType,
        entityName
      );
      const resolvedMetadata = mergeNodeMetadata(
        existingNode,
        entityMetadata,
        isPlaceholder
      );

      graph.setNode(resolvedNodeId, resolvedMetadata);
      transferEdges(graph, nodeId, resolvedNodeId);
      graph.removeNode(nodeId);

      return schema.parse(resolvedMetadata); // Return the resolved node
    }

    // Scenario 2: Resolved ID with Incomplete Metadata
    const updatedMetadata = mergeNodeMetadata(
      existingNode,
      entityMetadata,
      isPlaceholder
    );
    graph.setNode(nodeId, updatedMetadata);
    return schema.parse(updatedMetadata); // Return updated node
  }

  // Scenario 3: New Node
  const newNode = createNode<T>(
    nodeId,
    entityName,
    entityType,
    entityScope,
    entityMetadata,
    entityValidationSchema,
    isPlaceholder
  );

  graph.setNode(nodeId, newNode);

  return newNode; // Return newly created node
}

/**
 * Generates a unique ID for a top-level node based on its type, name, and file path.
 *
 * This function is used for primary entities such as classes, standalone functions,
 * and file-scoped variables, which can be uniquely identified by their file path.
 *
 * Format: `${filePath}#${type}#${name}`
 *
 * @param filePath - The file path where the node is defined, or "unresolved" for placeholders.
 * @param type - The type of the node (e.g., "class", "function", "variable").
 * @param name - The name of the node (e.g., class or function name).
 * @returns A string representing the unique identifier for the resolved node.
 */
export function generateNodeId(
  filePath: string,
  type: NodeEntityType,
  name: string
): string {
  return `${filePath}#${type}#${name}`;
}

/**
 * Generates a unique ID for a node that is nested within a parent node.
 *
 * This is ideal for entities like methods or properties that are part of a larger
 * structure, such as a class. The parent ID is used to establish a clear hierarchical
 * relationship, indicating the nested nature of the node.
 *
 * Format: `${parentId}#${type}#${name}`
 *
 * @param type - The type of the nested node (e.g., "method", "property").
 * @param name - The name of the nested node.
 * @param parentId - The ID of the parent node under which this node is nested.
 * @returns A string representing the unique identifier for the nested node.
 */
export function generateNestedNodeId(
  type: NodeEntityType,
  name: string,
  parentId: string
): string {
  return `${parentId}#${type}#${name}`;
}

/**
 * Generates a unique ID for a composite node, allowing for arbitrary nesting levels.
 *
 * This function is flexible and can handle deeper structures, such as decorators
 * on methods or properties. It joins multiple segments into a single ID, preserving
 * the hierarchical relationship across any number of levels.
 *
 * Format: `${id1}#${id2}#...#${idN}`
 *
 * @param ids - An array of strings representing each part of the composite ID.
 * @returns A string representing the unique identifier for the composite node.
 */
export function generateCompositeNodeId(...ids: string[]): string {
  return ids.join("#");
}

/**
 * Generates a consistent placeholder node ID based on type and name.
 *
 * @param type - The type of the node, represented by NodeType enum.
 * @param name - The name of the node or its unique identifier.
 * @returns A string representing the unique identifier for the placeholder node.
 */
export function generatePlaceholderNodeName(
  type: NodeEntityType,
  name: string
): string {
  return `placeholder#${type}#${name}`;
}

/**
 * Checks if a node with the given ID exists in the graph.
 *
 * @param graph - The graph instance that implements GraphInterface.
 * @param nodeId - The unique identifier for the node being checked.
 * @returns True if the node exists, false otherwise.
 */
export function isNode(graph: GraphInterface, nodeId: string): boolean {
  return graph.hasNode(nodeId);
}

// PRIVATE FUNCTIONS

/**
 * A generic function to create a node based on its entity type, name, scope, and metadata.
 * This function uses generics to allow for flexible creation of different node types
 * while ensuring the node conforms to the BaseNode structure.
 *
 * @param id - The unique ID of the node.
 * @param entityName - The name of the node, representing the specific entity.
 * @param entityType - The type of the node (e.g., "class", "method").
 * @param entityScope - The export scope of the node (e.g., "internal", "default export").
 * @param entityMetadata - Optional additional properties specific to the entity type.
 * @param entityValidationSchema - The Zod schema used to validate the node type.
 * @param isPlaceholder - Boolean indicating whether the node is initially a placeholder.
 * @returns A node of the specific type (e.g., ClassNode, FunctionNode), validated with the appropriate schema.
 */
function createNode<T extends BaseNode>(
  id: string,
  entityName: string,
  entityType: NodeEntityType,
  entityScope: ExportScopeType,
  entityMetadata: Record<string, any> = {}, // Specific metadata for the node
  entityValidationSchema: z.ZodSchema<T>, // Zod schema for validating the node type
  isPlaceholder = false
): T {
  // Build the node object with all required properties
  const baseNode: BaseNode = {
    id,
    name: entityName,
    type: entityType,
    scope: entityScope,
    isPlaceholder,
    metadata: entityMetadata, // Entity-specific metadata goes here
  };

  // Validate the node using the provided schema
  return entityValidationSchema.parse(baseNode); // Parse and validate with the specific schema, returning the correct node type
}

/**
 * Merges new metadata into an existing node's metadata, handling potential placeholder situations.
 * If the existing node is a placeholder, missing fields in the existing node are filled in with the new node's metadata.
 *
 * The function uses generics to ensure that the merged node is validated against the correct schema
 * for the given node type (e.g., ClassNode, InterfaceNode, etc.).
 *
 * @param existingNode - The existing (potentially incomplete) node.
 * @param newNode - The new node metadata to merge with the existing node.
 * @param entityValidationSchema - The Zod schema for validating the node type.
 * @param isPlaceholder - Boolean indicating if the node should continue to be treated as a placeholder.
 * @returns The merged node metadata, validated against the schema.
 */
function mergeNodes<T extends BaseNode>(
  existingNode: Partial<T>,
  newNode: Partial<T>,
  entityValidationSchema: z.ZodSchema<T>, // Zod schema for validating the node type
  isPlaceholder = false
): T {
  // Merge the new node data into the existing node, but only overwrite existing values if new values are provided
  const updatedNode: T = {
    ...existingNode,
    ...newNode,
    isPlaceholder,
    // Specifically handle metadata, ensuring we merge any existing metadata with new metadata
    metadata: {
      ...(existingNode.metadata || {}),
      ...(newNode.metadata || {}),
    },
  } as T;

  // Validate the updated node against the provided schema
  return entityValidationSchema.parse(updatedNode); // Ensure the merged node conforms to its specific schema
}

/**
 * Transfers all incoming and outgoing edges from a source node to a target node.
 * Useful when resolving a placeholder node by moving its relationships to a fully defined node.
 *
 * @param graph - The graph instance implementing GraphInterface.
 * @param sourceId - The ID of the node to transfer edges from.
 * @param targetId - The ID of the node to transfer edges to.
 */
function transferEdges(
  graph: GraphInterface,
  sourceId: string,
  targetId: string
): void {
  const predecessors = graph.predecessors(sourceId) || [];
  const successors = graph.successors(sourceId) || [];

  // Redirect edges from predecessors to the target node
  predecessors.forEach((pred) => {
    const edgeData = graph.edge(pred, sourceId);
    if (edgeData) {
      graph.setEdge(pred, targetId, edgeData);
    }
  });

  // Redirect edges to successors from the target node
  successors.forEach((succ) => {
    const edgeData = graph.edge(sourceId, succ);
    if (edgeData) {
      graph.setEdge(targetId, succ, edgeData);
    }
  });
}
