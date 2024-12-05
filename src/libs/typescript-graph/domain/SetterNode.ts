/**
 * @fileoverview TypeScript Setter Node representation
 * Defines structure and behavior for property setters in classes and interfaces.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import {
  CallableCapabilityValues,
  CallableDataSchema,
  createCallableData,
} from "@/libs/typescript-graph/domain/libs/TypeScriptCallable";
import {
  TypeScriptExportValues,
  TypeScriptNativeTypes,
} from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
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
 * Schema for SetterNode, extending TypeScriptNode with callable and structure member data.
 * - `data`: Combines properties specific to setters in class or interface structures, including:
 *   - `parameter`: Parameter defined for the setter.
 *   - `decorators`: Array of decorators applied to the setter.
 *   - `accessibility`: Accessibility level (e.g., public, private, protected).
 *
 * Examples:
 * - Public setter with decorators: `@Validate public set value(val: string) { ... }`
 */
export const SetterDataSchema = z
  .object({
    ...CallableDataSchema.shape,
    ...StructureMemberDataSchema.shape,
  })
  .strict();

export const SetterNodeSchema = TypeScriptNodeSchema(SetterDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Setter),
});

export type SetterData = z.infer<typeof SetterDataSchema>;
export type SetterNode = z.infer<typeof SetterNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR SETTER NODE
// =======================================================================================================

/**
 * Creates a validated SetterNode instance.
 *
 * Factory function that creates a setter node with its parameter and member properties.
 * Uses SetterData to specify the parameter, decorators, and accessibility.
 * Always sets returnType to void and capability to sync as these are fixed for setters.
 *
 * @example
 * ```typescript
 * const setterNode = createSetterNode(
 *   "setter1",
 *   "value",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     parameters: [createParameter("val", createGenericTypeReference("string"))],
 *     decorators: ["Validate"],
 *     accessibility: MemberVisibilityValues.Public
 *   }
 * );
 * ```
 */
export const createSetterNode: CreateNodeFn<SetterNode, SetterData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<SetterData> = {}
): SetterNode => {
  // Assemble callable data with explicit defaults for setter constraints
  const callableData = createCallableData(
    createGenericTypeReference(TypeScriptNativeTypes.Void),
    {
      parameters: entityData.parameters ?? [],
      generics: [], // Setters don't support generics
      capability: CallableCapabilityValues.Sync, // Setters are always synchronous
    }
  );

  // Assemble structure member data with explicit defaults
  const structureMemberData = createStructureMemberData({
    decorators: entityData.decorators ?? [],
    accessibility: entityData.accessibility ?? MemberVisibilityValues.Public,
    modifiers: [], // Setters don't support additional modifiers
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Setter,
    scope,
    status,
    { ...callableData, ...structureMemberData },
    SetterDataSchema,
    location
  ) as SetterNode;
};
