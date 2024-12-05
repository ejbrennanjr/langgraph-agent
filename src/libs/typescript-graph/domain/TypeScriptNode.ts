/**
 * @fileoverview Base TypeScript node structure and common functionality
 * Extends base Node with TypeScript-specific capabilities
 */

import { z } from "zod";

import { NodeSchema } from "@/libs/graph/domain/Node";

import {
  TypeScriptExportValues,
  TypeScriptExportValuesSchema,
  createValidationIssue,
} from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * Core TypeScript node types
 */
export enum TypeScriptNodeTypes {
  Class = "class",
  Constructor = "constructor",
  Decorator = "decorator",
  Enum = "enum",
  ExternalImportEntity = "external-import-entity",
  ExternalModule = "external-module",
  Function = "function",
  Getter = "getter",
  Interface = "interface",
  Method = "method",
  Module = "module",
  NamespaceImport = "namespace-import",
  Property = "property",
  Setter = "setter",
  Type = "type",
  Variable = "variable",
  WildcardExport = "wildcard-export",
}

export const TypeScriptNodeTypesSchema = z.nativeEnum(TypeScriptNodeTypes);

/**
 * Node resolution status
 */
export enum TypeScriptNodeStatus {
  Placeholder = "placeholder",
  Resolved = "resolved",
}

export const TypeScriptNodeStatusSchema = z.nativeEnum(TypeScriptNodeStatus);

// =======================================================================================================
// LOCATION SCHEMA
// =======================================================================================================

/**
 * Schema for source code location information
 */
export const SourceLocationSchema = z
  .object({
    filePath: z.string(),
    startLine: z.number(),
    startColumn: z.number(),
    endLine: z.number(),
    endColumn: z.number(),
  })
  .strict();

export type SourceLocation = z.infer<typeof SourceLocationSchema>;

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Base schema for all TypeScript nodes
 * @param dataSchema Schema for entity-specific data
 * @param additionalFields Additional fields specific to the node type
 * @returns Schema combining base node structure with TypeScript specifics
 */
export const TypeScriptNodeSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
  additionalFields: z.ZodRawShape = {}
) =>
  NodeSchema(dataSchema)
    .extend({
      name: z.string().min(1, "Name must contain at least one character"),
      type: TypeScriptNodeTypesSchema,
      scope: TypeScriptExportValuesSchema,
      status: TypeScriptNodeStatusSchema,
      location: SourceLocationSchema,
      ...additionalFields,
    })
    .strict()
    .superRefine((data, ctx) => {
      // Validate that Placeholder nodes have internal scope
      if (
        data.status === TypeScriptNodeStatus.Placeholder &&
        data.scope !== TypeScriptExportValues.Internal
      ) {
        createValidationIssue(
          ctx,
          "Placeholder nodes must have internal scope",
          ["scope"]
        );
      }
    });

/**
 * Defines the TypeScript node type based on the schema
 */
export type TypeScriptNode<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof TypeScriptNodeSchema<T>>
>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Creates a base TypeScript node with common attributes
 */
export const createTypeScriptNode = <T extends z.ZodTypeAny>(
  id: string = "",
  name: string = "",
  type: TypeScriptNodeTypes,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Placeholder,
  data: z.infer<T>,
  schema: T,
  location: SourceLocation
): TypeScriptNode<T> => {
  return TypeScriptNodeSchema(schema).parse({
    id,
    name,
    type,
    scope,
    status,
    data,
    location,
  });
};

// =======================================================================================================
// TYPE GUARDS
// =======================================================================================================

/**
 * Type guard to check if an entity is a TypeScript node
 */
export function isTypeScriptNode<T extends z.ZodTypeAny>(
  node: unknown,
  schema: T
): node is TypeScriptNode<T> {
  return TypeScriptNodeSchema(schema).safeParse(node).success;
}
