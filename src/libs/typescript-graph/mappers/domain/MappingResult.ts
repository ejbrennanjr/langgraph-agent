/**
 * @fileoverview Type definition for mapper function results
 * @path @/libs/typescript-graph/mappers/types/MappingResult.ts
 */

import { z } from "zod";
import { TypeScriptNodeSchema } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeSchema } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptNode } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdge } from "@/libs/typescript-graph/domain/TypeScriptEdge";

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for the standard return type of all mapper functions.
 * Contains nodes identified during mapping, relationships discovered,
 * and optionally partial data for the mapped entity.
 *
 * The data field uses z.object(dataSchema.shape).partial().optional() which:
 * 1. dataSchema.shape - Extracts the shape (field definitions) from the schema
 * 2. .partial() - Makes all fields optional (Partial<T> equivalent)
 * 3. .optional() - Makes the entire data object optional
 *
 * Example with ClassDataSchema:
 * ```typescript
 * // Original schema has required fields:
 * {
 *   generics: z.array(...).default([]),
 *   extends: z.array(...).default([]),
 *   memberNames: z.object(...).default({})
 * }
 *
 * // After .partial().optional():
 * {
 *   data?: {
 *     generics?: z.array(...),
 *     extends?: z.array(...),
 *     memberNames?: z.object(...)
 *   }
 * }
 * ```
 */
export const MappingResultSchema = <T extends z.ZodObject<any, any>>(
  dataSchema: T
) =>
  z
    .object({
      nodes: z.array(TypeScriptNodeSchema(z.any())).default([]), // Default to empty array
      edges: z.array(TypeScriptEdgeSchema()).default([]), // Default to empty array
      data: dataSchema.partial().default({}),
    })
    .strict();

export type MappingResult<
  T extends z.ZodObject<any, any> = z.ZodObject<any, any>
> = z.infer<ReturnType<typeof MappingResultSchema<T>>>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Creates an empty mapping result.
 */
export function createEmptyMappingResult<T extends z.ZodObject<any, any>>(
  dataSchema?: T
): MappingResult<T> {
  const schema = dataSchema ?? z.object({});
  return MappingResultSchema(schema).parse({
    nodes: [],
    edges: [],
    data: schema.parse({}),
  });
}

/**
 * Creates a complete mapping result with all fields.
 *
 * @example
 * ```typescript
 * const result = createMappingResult(
 *   ClassDataSchema,
 *   [classNode],
 *   [extendsEdge, methodEdge],
 *   {
 *     generics: ['T'],
 *     memberNames: { methods: ['calculate'] }
 *   }
 * );
 * ```
 */
export function createMappingResult<T extends z.ZodObject<any, any>>(
  dataSchema: T,
  nodes: TypeScriptNode<z.ZodTypeAny>[],
  edges: TypeScriptEdge[],
  data?: Partial<z.infer<T>>
): MappingResult<T> {
  return MappingResultSchema(dataSchema).parse({
    nodes,
    edges,
    data: dataSchema.parse(data || {}),
  });
}

/**
 * Creates a partial mapping result, typically used when mapping
 * a specific aspect of a node.
 *
 * @example
 * ```typescript
 * // Mapping just the methods of a class
 * const methodResult = createPartialMappingResult(
 *   ClassDataSchema,
 *   [],
 *   [methodEdge],
 *   {
 *     memberNames: { methods: ['calculate'] }
 *   }
 * );
 * ```
 */
export function createPartialMappingResult<T extends z.ZodObject<any, any>>(
  dataSchema: T,
  nodes: TypeScriptNode<z.ZodTypeAny>[] = [],
  edges: TypeScriptEdge[] = [],
  data?: Partial<z.infer<T>>
): MappingResult<T> {
  return createMappingResult(dataSchema, nodes, edges, data);
}
