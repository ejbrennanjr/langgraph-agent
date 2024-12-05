/**
 * @fileoverview External Import Entity Node representation
 * Represents a generic entity imported from an external module with minimal details,
 * serving as a placeholder in the graph.
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
  TypeScriptNodeTypesSchema,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for ExternalImportEntityNode data
 * This schema provides minimal information to represent a generic imported entity
 * from an external module, acting as a placeholder in the graph.
 */
export const ExternalImportEntityDataSchema = z
  .object({
    entityType: TypeScriptNodeTypesSchema.default(
      TypeScriptNodeTypes.ExternalImportEntity
    ),
  })
  .strict();

export const ExternalImportEntityNodeSchema = TypeScriptNodeSchema(
  ExternalImportEntityDataSchema,
  {
    type: z.literal(TypeScriptNodeTypes.ExternalImportEntity),
  }
);

export type ExternalImportEntityData = z.infer<
  typeof ExternalImportEntityDataSchema
>;
export type ExternalImportEntityNode = z.infer<
  typeof ExternalImportEntityNodeSchema
>;

// =======================================================================================================
// FACTORY FUNCTION
// =======================================================================================================

/**
 * Creates a validated ExternalImportEntityNode instance.
 *
 * Factory function that creates a minimal representation of an externally imported
 * entity. All external import entities are automatically set to External scope.
 *
 * @example
 * ```typescript
 * const externalEntity = createExternalImportEntityNode(
 *   "external-entity1",
 *   "merge",
 *   TypeScriptExportValues.External, // This will always be External
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     entityType: TypeScriptNodeTypes.Function
 *   }
 * );
 * ```
 */
export const createExternalImportEntityNode: CreateNodeFn<
  ExternalImportEntityNode,
  ExternalImportEntityData
> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.External,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<ExternalImportEntityData> = {}
): ExternalImportEntityNode => {
  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.ExternalImportEntity,
    TypeScriptExportValues.External, // Override scope to always be External
    status,
    {
      ...entityData,
      entityType:
        entityData.entityType ?? TypeScriptNodeTypes.ExternalImportEntity, // Ensure entityType defaults correctly
    },
    ExternalImportEntityDataSchema,
    location
  ) as ExternalImportEntityNode;
};
