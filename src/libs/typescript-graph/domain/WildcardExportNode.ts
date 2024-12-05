/**
 * @fileoverview Wildcard Export Node representation
 * Represents a wildcard export using the syntax: export * from './abc'
 * Acts as a container providing access to all exports from a module without specific named exports.
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
 * Schema for WildcardExportNode data
 * Contains the source module path for the wildcard export.
 *
 * @example
 * For: export * from './abc'
 * sourceModulePath would be "./abc"
 */
export const WildcardExportDataSchema = z
  .object({
    sourceModulePath: z
      .string()
      .min(1, "Source module path must not be empty")
      .default("unresolved"),
  })
  .strict();

export const WildcardExportNodeSchema = TypeScriptNodeSchema(
  WildcardExportDataSchema,
  {
    type: z.literal(TypeScriptNodeTypes.WildcardExport),
  }
);

export type WildcardExportData = z.infer<typeof WildcardExportDataSchema>;
export type WildcardExportNode = z.infer<typeof WildcardExportNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION
// =======================================================================================================

/**
 * Creates a validated WildcardExportNode instance.
 *
 * Factory function that creates a node representing a wildcard export
 * that provides access to all exports from a module without specific named exports.
 *
 * @example
 * ```typescript
 * // For: export * from './utils'
 * const wildcardExport = createWildcardExportNode(
 *   "/src/utils.ts::wildcard-export::utils", // ID combining module path and wildcard type
 *   "utils",                                 // The name of the export node itself
 *   TypeScriptExportValues.External,
 *   TypeScriptNodeStatus.Placeholder,
 *   { filePath: "/src/app.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 30 },
 *   {
 *     sourceModulePath: "./utils"            // The source module path for the export
 *   }
 * );
 * ```
 */
export const createWildcardExportNode: CreateNodeFn<
  WildcardExportNode,
  WildcardExportData
> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.External,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Placeholder,
  location: SourceLocation,
  entityData: Partial<WildcardExportData> = {}
): WildcardExportNode => {
  const wildcardData = {
    sourceModulePath: entityData.sourceModulePath ?? "unresolved",
  };

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.WildcardExport,
    scope,
    status,
    wildcardData,
    WildcardExportDataSchema,
    location
  ) as WildcardExportNode;
};
