/**
 * @fileoverview External Module Node representation
 * Represents an external module in the graph with only minimal details,
 * serving as a placeholder without listing imports or internal structure.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

import {
  createTypeScriptNode,
  SourceLocation,
  TypeScriptNodeSchema,
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for ExternalModuleNode data
 * This schema provides minimal information to represent an external module
 * in the graph without any import lists or internal details.
 */
export const ExternalModuleDataSchema = z.object({}).strict();

export const ExternalModuleNodeSchema = TypeScriptNodeSchema(
  ExternalModuleDataSchema,
  {
    type: z.literal(TypeScriptNodeTypes.ExternalModule),
  }
);

export type ExternalModuleData = z.infer<typeof ExternalModuleDataSchema>;
export type ExternalModuleNode = z.infer<typeof ExternalModuleNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION
// =======================================================================================================

/**
 * Creates a validated ExternalModuleNode instance.
 *
 * Factory function that creates a minimal representation of an external module.
 * All external modules are automatically set to External scope.
 *
 * @example
 * ```typescript
 * const externalModule = createExternalModuleNode(
 *   "external-lodash",
 *   "lodash",
 *   TypeScriptExportValues.External, // This will always be External
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {}
 * );
 * ```
 */
export const createExternalModuleNode: CreateNodeFn<
  ExternalModuleNode,
  ExternalModuleData
> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.External,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<ExternalModuleData> = {}
): ExternalModuleNode => {
  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.ExternalModule, // Set type explicitly to ExternalModule
    TypeScriptExportValues.External, // Override scope to always be External
    status,
    entityData,
    ExternalModuleDataSchema,
    location
  ) as ExternalModuleNode;
};
