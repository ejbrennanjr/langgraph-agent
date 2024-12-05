/**
 * @fileoverview Namespace Import Node representation
 * Represents a namespace import using the syntax: import * as xyz from './abc'
 * Acts as a container providing access to all exports from a module through
 * a single namespace identifier.
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
 * Schema for NamespaceImportNode data
 * Contains the namespace identifier used to access the module's exports.
 *
 * @example
 * For: import * as xyz from './abc'
 * namespaceName would be "xyz"
 */
export const NamespaceImportDataSchema = z
  .object({
    namespaceName: z
      .string()
      .min(1, "Namespace name must not be empty")
      .default("uresolved"),
  })
  .strict();

export const NamespaceImportNodeSchema = TypeScriptNodeSchema(
  NamespaceImportDataSchema,
  {
    type: z.literal(TypeScriptNodeTypes.NamespaceImport),
  }
);

export type NamespaceImportData = z.infer<typeof NamespaceImportDataSchema>;
export type NamespaceImportNode = z.infer<typeof NamespaceImportNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION
// =======================================================================================================

/**
 * Creates a validated NamespaceImportNode instance.
 *
 * Factory function that creates a node representing a namespace import
 * that provides access to all exports from a module through a single
 * namespace identifier.
 *
 * @example
 * ```typescript
 * // For: import * as utils from './utils'
 * const namespaceImport = createNamespaceImportNode(
 *   "/src/utils.ts::namespace-import::utils", // ID combining module path and namespace name
 *   "utils",                                  // The name of the import node itself
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/app.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 30 },
 *   {
 *     namespaceName: "utils"                  // The namespace identifier
 *   }
 * );
 *
 * // For: import * as path from 'path'
 * const namespaceImport = createNamespaceImportNode(
 *   "path::namespace-import::path",
 *   "path",
 *   TypeScriptExportValues.External,
 *   TypeScriptNodeStatus.Placeholder,
 *   { filePath: "/src/app.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     namespaceName: "path"
 *   }
 * );
 * ```
 */
export const createNamespaceImportNode: CreateNodeFn<
  NamespaceImportNode,
  NamespaceImportData
> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<NamespaceImportData> = {}
): NamespaceImportNode => {
  const namespaceData = {
    namespaceName: entityData.namespaceName ?? name, // Use provided name or fall back to node name
  };

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.NamespaceImport,
    scope,
    status,
    namespaceData,
    NamespaceImportDataSchema,
    location
  ) as NamespaceImportNode;
};
