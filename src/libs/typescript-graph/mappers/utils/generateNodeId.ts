/**
 * @fileoverview Node ID generation utility
 * Provides consistent ID generation for all TypeScript nodes in the graph.
 * @path @/libs/typescript-graph/mappers/utils/generateNodeId.ts
 */

import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * Generates a unique identifier for any TypeScript node.
 * Format: filePath::nodeType::nodeName
 *
 * Examples:
 * - /src/user.ts::class::UserService
 * - /src/math.ts::function::calculate
 * - /src/index.ts::module::index
 *
 * @param filePath - Path to the file containing the node
 * @param nodeType - Type of the TypeScript node
 * @param nodeName - Name identifier for the node
 * @returns A unique identifier string for the node
 */
export function generateNodeId(
  filePath: string,
  nodeType: TypeScriptNodeTypes,
  nodeName: string
): string {
  return [filePath, nodeType, nodeName].join("::");
}
