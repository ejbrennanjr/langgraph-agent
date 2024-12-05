/**
 * @fileoverview TypeScript Variable Node representation
 * Defines structure and behavior for variable declarations in TypeScript code.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import {
  TypeScriptExportValues,
  TypeScriptNativeTypes,
} from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { GenericTypeReferenceSchema } from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";

import {
  createTypeScriptNode,
  SourceLocation,
  TypeScriptNodeSchema,
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * Types of variable declarations in TypeScript
 */
export enum VariableDeclarationKind {
  Let = "let",
  Const = "const",
  Var = "var",
  Declare = "declare",
  Unresolved = "unresolved",
}

export const VariableDeclarationKindSchema = z.nativeEnum(
  VariableDeclarationKind
);

/**
 * Types of destructuring patterns
 */
export enum DestructuringKind {
  Object = "object",
  Array = "array",
  None = "none",
  Unresolved = "unresolved",
}

export const DestructuringKindSchema = z.nativeEnum(DestructuringKind);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for destructuring pattern information
 */
export const DestructuringPatternSchema = z
  .object({
    kind: DestructuringKindSchema,
    names: z.array(z.string()),
  })
  .strict();

export type DestructuringPattern = z.infer<typeof DestructuringPatternSchema>;

/**
 * Schema for VariableNode, extending TypeScriptNode with variable-specific data.
 * - `data`: Contains details specific to variable declarations, including:
 *   - `declarationKind`: The type of declaration (let/const/var/declare)
 *   - `datatype`: The type of the variable (explicit or inferred)
 *   - `hasInitializer`: Whether the variable is initialized
 *   - `isReadonly`: Whether the variable is readonly (const assertions)
 *   - `destructuring`: Destructuring pattern information if applicable
 *   - `decorators`: Array of decorators applied to the variable
 */
export const VariableDataSchema = z
  .object({
    declarationKind: VariableDeclarationKindSchema.default(
      VariableDeclarationKind.Unresolved
    ),
    datatype: GenericTypeReferenceSchema.default({
      baseType: TypeScriptNativeTypes.Void, // Default base type for datatype
      typeArguments: [], // Default to no type arguments
    }),
    hasInitializer: z.boolean().default(false),
    isReadonly: z.boolean().default(false),
    destructuring: DestructuringPatternSchema.default({
      kind: DestructuringKind.Unresolved,
      names: [],
    }),
    decorators: z.array(z.string()).default([]),
  })
  .strict();

export const VariableNodeSchema = TypeScriptNodeSchema(VariableDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Variable),
});

export type VariableData = z.infer<typeof VariableDataSchema>;
export type VariableNode = z.infer<typeof VariableNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Creates a destructuring pattern object. Helper function for creating
 * destructuring patterns used in variable declarations.
 */
export const createDestructuringPattern = (
  kind: DestructuringKind,
  names: string[]
): DestructuringPattern => ({
  kind,
  names,
});

/**
 * Creates a validated VariableNode instance.
 *
 * Factory function that creates a variable node with its declaration kind,
 * data type, and other variable-specific properties.
 *
 * @example Simple Variable
 * ```typescript
 * const variableNode = createVariableNode(
 *   "var1",
 *   "count",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     declarationKind: VariableDeclarationKind.Let,
 *     datatype: createGenericTypeReference("number"),
 *     hasInitializer: true
 *   }
 * );
 * ```
 *
 * @example Destructured Variable
 * ```typescript
 * const destructuredVar = createVariableNode(
 *   "var2",
 *   "data",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     declarationKind: VariableDeclarationKind.Const,
 *     datatype: createGenericTypeReference("Response"),
 *     hasInitializer: true,
 *     destructuring: createDestructuringPattern(DestructuringKind.Object, ["status", "body"]),
 *     isReadonly: true
 *   }
 * );
 * ```
 */
export const createVariableNode: CreateNodeFn<VariableNode, VariableData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<VariableData> = {} // Allow all fields to be optional
): VariableNode => {
  const variableData = VariableDataSchema.parse({
    ...entityData,
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Variable,
    scope,
    status,
    variableData,
    VariableDataSchema,
    location
  ) as VariableNode;
};
