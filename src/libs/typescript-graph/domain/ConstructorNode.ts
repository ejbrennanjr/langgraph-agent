/**
 * @fileoverview TypeScript Constructor Node representation
 *
 * This module defines the structure and factory function for constructor nodes in the TypeScript graph.
 * Constructors are special class members that combine both callable properties (parameters, generics)
 * and structure member properties (visibility, decorators).
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import {
  CallableDataSchema,
  CallableCapabilityValues,
  createCallableData,
} from "@/libs/typescript-graph/domain/libs/TypeScriptCallable";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { createGenericTypeReference } from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";
import {
  createStructureMemberData,
  MemberVisibilityValues,
  StructureMemberDataSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptStructureMember";

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
 * Schema for ConstructorNode, extending TypeScriptNode with both callable and structure member data.
 *
 * Constructor-specific constraints:
 * - Always has void return type
 * - Always has Sync capability
 * - Always has Public visibility
 * - Never has modifiers (static, abstract, etc. are not applicable)
 */
export const ConstructorDataSchema = z
  .object({
    ...CallableDataSchema.shape,
    ...StructureMemberDataSchema.shape,
  })
  .strict();

export const ConstructorNodeSchema = TypeScriptNodeSchema(
  ConstructorDataSchema,
  {
    type: z.literal(TypeScriptNodeTypes.Constructor),
  }
);

export type ConstructorData = z.infer<typeof ConstructorDataSchema>;
export type ConstructorNode = z.infer<typeof ConstructorNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR CONSTRUCTOR NODE
// =======================================================================================================

/**
 * Creates a validated ConstructorNode instance.
 *
 * Factory function that creates a constructor node with its predefined constraints
 * and optional fields. Constructors have several fixed characteristics that are
 * enforced by this factory:
 * - Return type is always void
 * - Capability is always sync
 * - Visibility is always public
 * - No modifiers are allowed
 *
 * @example
 * ```typescript
 * const constructorNode = createConstructorNode(
 *   "constructor1",
 *   "constructor",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/service.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     parameters: [
 *       { name: "id", type: createGenericTypeReference("string") },
 *       { name: "config", type: createGenericTypeReference("Config") }
 *     ],
 *     generics: [{ name: "T" }],
 *     decorators: ["Inject"]
 *   }
 * );
 * ```
 */
export const createConstructorNode: CreateNodeFn<
  ConstructorNode,
  ConstructorData
> = (
  id: string,
  name: string = "constructor",
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<ConstructorData> = {}
): ConstructorNode => {
  // Create callable data with constructor-specific constraints
  const callableData = createCallableData(createGenericTypeReference("void"), {
    parameters: entityData.parameters,
    generics: entityData.generics,
    capability: CallableCapabilityValues.Sync,
  });

  // Create structure member data with constructor-specific constraints
  const structureMemberData = createStructureMemberData({
    modifiers: [], // Constructors never have modifiers
    decorators: entityData.decorators,
    accessibility: MemberVisibilityValues.Public, // Constructors are always public
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Constructor,
    scope,
    status,
    { ...callableData, ...structureMemberData },
    ConstructorDataSchema,
    location
  ) as ConstructorNode;
};
