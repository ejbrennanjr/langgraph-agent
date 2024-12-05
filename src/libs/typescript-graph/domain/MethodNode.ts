/**
 * @fileoverview TypeScript Method Node representation
 * Defines structure and behavior for methods in classes and interfaces,
 * combining callable and structure member attributes.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import {
  CallableCapabilityValues,
  CallableDataSchema,
  createCallableData,
} from "@/libs/typescript-graph/domain/libs/TypeScriptCallable";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
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
 * Schema for MethodNode, extending TypeScriptNode with callable and structure member data.
 * - `data`: Combines properties specific to method calls and class/interface membership, such as:
 *   - `parameters`: Array of method parameters.
 *   - `returnType`: Return type of the method.
 *   - `generics`: Array of generics used by the method.
 *   - `capability`: Callable-specific capability (e.g., async, sync).
 *   - `modifiers`: Structure member-specific modifiers (e.g., readonly, static).
 *   - `decorators`: Array of decorators applied to the method.
 *   - `accessibility`: Accessibility level (public, private, protected).
 *
 * Examples:
 * - Public static method: `public static calculateTotal(input: number): number`
 * - Async protected method with generic: `protected async fetchData<T>(id: string): Promise<T>`
 */
export const MethodDataSchema = z
  .object({
    ...CallableDataSchema.shape,
    ...StructureMemberDataSchema.shape,
  })
  .strict();

export const MethodNodeSchema = TypeScriptNodeSchema(MethodDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Method),
});

export type MethodData = z.infer<typeof MethodDataSchema>;
export type MethodNode = z.infer<typeof MethodNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR METHOD NODE
// =======================================================================================================

/**
 * Creates a validated MethodNode instance.
 *
 * Factory function that creates a method node with both callable and structure
 * member properties. Uses MethodData to specify return type, parameters,
 * generics, capability, accessibility, modifiers, and decorators.
 *
 * @example
 * ```typescript
 * const methodNode = createMethodNode(
 *   "method1",
 *   "calculateTotal",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     returnType: createGenericTypeReference("number"),
 *     parameters: [createParameter("input", createGenericTypeReference("number"))],
 *     generics: [],
 *     capability: CallableCapabilityValues.Sync,
 *     accessibility: MemberVisibilityValues.Public,
 *     modifiers: [ModifierValues.Static],
 *     decorators: ["Log"]
 *   }
 * );
 * ```
 */
export const createMethodNode: CreateNodeFn<MethodNode, MethodData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<MethodData> = {}
): MethodNode => {
  // Assemble callable data with explicit fallbacks
  const callableData = createCallableData(entityData.returnType, {
    parameters: entityData.parameters ?? [],
    generics: entityData.generics ?? [],
    capability: entityData.capability ?? CallableCapabilityValues.Sync,
  });

  // Assemble structure member data with explicit fallbacks
  const structureMemberData = createStructureMemberData({
    modifiers: entityData.modifiers ?? [],
    accessibility: entityData.accessibility ?? MemberVisibilityValues.Public,
    decorators: entityData.decorators ?? [],
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Method,
    scope,
    status,
    { ...callableData, ...structureMemberData },
    MethodDataSchema,
    location
  ) as MethodNode;
};
