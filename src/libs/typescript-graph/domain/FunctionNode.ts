/**
 * @fileoverview TypeScript Function Node representation
 * Defines structure and behavior for standalone functions in TypeScript,
 * including various declaration styles.
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
 * Enum for function declaration styles, including:
 * - `Standard`: Standard function declaration, e.g., `function foo()`
 * - `FunctionExpression`: Assigned function, e.g., `const foo = function()`
 * - `ArrowFunction`: Arrow function, e.g., `const foo = () =>`
 */
export enum FunctionDeclarationStyles {
  Standard = "standard",
  FunctionExpression = "function expression",
  ArrowFunction = "arrow function",
  Unresolved = "unresolved",
}

export const FunctionDeclarationStylesSchema = z.nativeEnum(
  FunctionDeclarationStyles
);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for FunctionNode, extending TypeScriptNode with callable data specific to standalone functions.
 * - `data`: Contains callable properties, `declarationStyle`, and other function-specific details.
 *
 * Examples:
 * - `function calculateSum(a: number, b: number): number`
 * - `const fetchData = async <T>(url: string): Promise<T> => {...}`
 */
export const FunctionDataSchema = z
  .object({
    ...CallableDataSchema.shape,
    declarationStyle: FunctionDeclarationStylesSchema.default(
      FunctionDeclarationStyles.Unresolved
    ),
  })
  .strict();

export const FunctionNodeSchema = TypeScriptNodeSchema(FunctionDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Function),
});

export type FunctionData = z.infer<typeof FunctionDataSchema>;
export type FunctionNode = z.infer<typeof FunctionNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR FUNCTION NODE
// =======================================================================================================

/**
 * Creates a validated FunctionNode instance.
 *
 * Factory function that creates a function node with all its callable properties
 * and declaration style. Uses FunctionData to specify return type, parameters,
 * generics, capability, and declaration style.
 *
 * @example
 * ```typescript
 * const functionNode = createFunctionNode(
 *   "function1",
 *   "calculateSum",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     returnType: createGenericTypeReference("number"),
 *     declarationStyle: FunctionDeclarationStyles.ArrowFunction,
 *     parameters: [createParameter("a", createGenericTypeReference("number"))],
 *     generics: [],
 *     capability: CallableCapabilityValues.Sync
 *   }
 * );
 * ```
 */
export const createFunctionNode: CreateNodeFn<FunctionNode, FunctionData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<FunctionData> = {}
): FunctionNode => {
  const callableData = createCallableData(entityData.returnType, {
    parameters: entityData.parameters,
    generics: entityData.generics,
    capability: entityData.capability,
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Function,
    scope,
    status,
    {
      ...callableData,
      declarationStyle:
        entityData.declarationStyle ?? FunctionDeclarationStyles.Unresolved, // Explicit fallback for declarationStyle
    },
    FunctionDataSchema,
    location
  ) as FunctionNode;
};
