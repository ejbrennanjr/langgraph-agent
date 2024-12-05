import { GraphInterface } from "../libs/GraphInterface";
import { EdgeMetadataAttribute, EdgeRelationshipType } from "../enums";
import { BaseEdge, BaseEdgeSchema } from "../types";

/**
 * Adds an edge between two nodes in the graph with the specified type and additional properties.
 * Validates the edge data to ensure it adheres to the expected structure.
 *
 * @param graph - The graph instance implementing GraphInterface.
 * @param sourceId - The ID of the source node.
 * @param targetId - The ID of the target node.
 * @param edgeType - The type of the edge, using the EdgeType enum.
 * @param additionalProps - Optional additional properties to add to the edge.
 */
export function addEdge(
  graph: GraphInterface,
  sourceId: string,
  targetId: string,
  edgeType: EdgeRelationshipType,
  additionalProps: Partial<BaseEdge> = {}
): void {
  // Create edge data that complies with EdgeMetadata, including the mandatory `type` property
  const edgeData: BaseEdge = {
    [EdgeMetadataAttribute.Type]: edgeType,
    ...additionalProps,
  };

  // Validate the edge data
  const validatedEdgeData = BaseEdgeSchema.parse(edgeData);

  // Call GraphInterface's setEdge to add or update the edge with the constructed metadata
  graph.setEdge(sourceId, targetId, validatedEdgeData);
}

/**
 * Utility function to create edge metadata with default properties.
 * Useful for ensuring that all edges adhere to a standard structure.
 *
 * @param type - The edge type, as an EdgeType enum value.
 * @param alias - An optional alias attribute.
 * @returns EdgeMetadata object with the specified properties.
 */
export function createEdgeMetadata(
  type: EdgeRelationshipType,
  alias?: string
): BaseEdge {
  return {
    [EdgeMetadataAttribute.Type]: type,
    ...(alias && { [EdgeMetadataAttribute.Alias]: alias }),
  };
}
