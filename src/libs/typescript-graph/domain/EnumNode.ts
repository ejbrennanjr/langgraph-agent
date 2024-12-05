/**
 * @fileoverview TypeScript Enum Node representation
 *
 * This module defines the structure and factory function for enum nodes in the TypeScript graph.
 * Enums are collections of named constants that can optionally have specific values assigned.
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
 * Schema for EnumMember, representing a single entry in an enum.
 * - `name`: Required name of the enum member.
 * - `value`: Optional value for the enum member.
 */
export const EnumMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Enum member name must contain at least one character"),
  value: z.string().or(z.number()).optional(),
});

export type EnumMember = z.infer<typeof EnumMemberSchema>;

/**
 * Schema for enum-specific data.
 * - `members`: Array of enum members, each with a name and optional value.
 */
export const EnumDataSchema = z
  .object({
    members: z.array(EnumMemberSchema).default([]),
  })
  .strict();

export const EnumNodeSchema = TypeScriptNodeSchema(EnumDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Enum),
});

export type EnumData = z.infer<typeof EnumDataSchema>;
export type EnumNode = z.infer<typeof EnumNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR ENUM NODE
// =======================================================================================================

/**
 * Creates a validated EnumNode instance.
 *
 * Factory function that creates an enum node with its members.
 * Uses EnumData to specify the enum members, where each member has
 * a name and an optional value.
 *
 * @example
 * ```typescript
 * const enumNode = createEnumNode(
 *   "enum1",
 *   "Colors",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/enums.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     members: [
 *       { name: "Red" },
 *       { name: "Green", value: "GREEN" },
 *       { name: "Blue", value: 2 }
 *     ]
 *   }
 * );
 * ```
 */
export const createEnumNode: CreateNodeFn<EnumNode, EnumData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<EnumData> = {}
): EnumNode => {
  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Enum,
    scope,
    status,
    {
      members: entityData.members ?? [], // Ensure `members` is always defined as an array
    },
    EnumDataSchema,
    location
  ) as EnumNode;
};
