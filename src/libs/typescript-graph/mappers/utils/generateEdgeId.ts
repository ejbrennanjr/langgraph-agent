/**
 * @fileoverview Edge ID generation utility
 * Provides consistent ID generation for TypeScript graph edges.
 * @path @/libs/typescript-graph/mappers/utils/generateEdgeId.ts
 */

import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";

/**
 * Generates a unique identifier for any TypeScript edge.
 * Format: sourceId-->relationship-->targetId
 *
 * Examples:
 * - /src/user.ts::class::UserService-->extends-->/src/base.ts::class::BaseService
 * - /src/math.ts::module::math-->imports-->/src/utils.ts::module::utils
 * - /src/index.ts::class::App-->uses-->/src/services.ts::class::AuthService
 *
 * @param sourceId - ID of the source node
 * @param relationship - Type of relationship between nodes
 * @param targetId - ID of the target node
 * @returns A unique identifier string for the edge
 */
export function generateEdgeId(
  sourceId: string,
  relationship: TypeScriptEdgeRelationshipValues,
  targetId: string
): string {
  return [sourceId, relationship, targetId].join("-->");
}
