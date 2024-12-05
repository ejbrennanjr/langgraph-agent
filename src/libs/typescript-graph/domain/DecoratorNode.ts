/**
 * @fileoverview TypeScript Decorator Node representation
 *
 * This module defines the structure and factory function for decorator nodes in the TypeScript graph.
 * Decorators are special declarations that can be attached to classes, methods, properties,
 * parameters, or accessors, and may include arguments.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  GenericTypeReference,
  GenericTypeReferenceSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";

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
 * Valid targets for decorator application.
 * TypeScript decorators can only be attached to specific code elements.
 */
export enum DecoratorTargetValues {
  Class = "class",
  Method = "method",
  Property = "property",
  Parameter = "parameter",
  Accessor = "accessor",
  Unresolved = "unresolved",
}

export const DecoratorTargetValuesSchema = z.nativeEnum(DecoratorTargetValues);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for a decorator argument.
 * Each argument includes both its value and type information.
 */
export const DecoratorArgumentSchema = z
  .object({
    value: z
      .any()
      .nullish()
      .transform((v) => v ?? null),
    typeReference: GenericTypeReferenceSchema,
  })
  .strict();

export type DecoratorArgument = z.infer<typeof DecoratorArgumentSchema>;

/**
 * Schema for decorator-specific data.
 * Every decorator must have a target (where it's applied) and may have arguments.
 */
export const DecoratorDataSchema = z
  .object({
    target: DecoratorTargetValuesSchema.default(
      DecoratorTargetValues.Unresolved
    ),
    arguments: z.array(DecoratorArgumentSchema).default([]),
  })
  .strict();

export type DecoratorData = z.infer<typeof DecoratorDataSchema>;

/**
 * Complete schema for Decorator nodes, combining base node fields with decorator-specific data.
 */
export const DecoratorNodeSchema = TypeScriptNodeSchema(DecoratorDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Decorator),
});

export type DecoratorNode = z.infer<typeof DecoratorNodeSchema>;

// =======================================================================================================
// HELPER FUNCTIONS
// =======================================================================================================

/**
 * Creates a decorator argument with validation.
 *
 * @param value - The value provided to the decorator argument
 * @param typeReference - The type of the argument
 * @returns A validated DecoratorArgument
 *
 * @example
 * ```typescript
 * const arg = createDecoratorArgument(
 *   "service",
 *   createGenericTypeReference("string")
 * );
 * ```
 */
export const createDecoratorArgument = (
  value: any,
  typeReference: GenericTypeReference
): DecoratorArgument => {
  return DecoratorArgumentSchema.parse({
    value,
    typeReference,
  });
};

// =======================================================================================================
// FACTORY FUNCTION FOR DECORATOR NODE
// =======================================================================================================

/**
 * Creates a validated DecoratorNode instance.
 *
 * Factory function that creates a decorator node. Decorators require a target
 * specifying where they can be applied (class, method, property, etc.) and
 * may optionally include arguments.
 *
 * @example
 * ```typescript
 * const decoratorNode = createDecoratorNode(
 *   "dec1",
 *   "Injectable",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/service.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     target: DecoratorTargetValues.Class,
 *     arguments: [
 *       createDecoratorArgument("service", createGenericTypeReference("string"))
 *     ]
 *   }
 * );
 * ```
 */
export const createDecoratorNode: CreateNodeFn<DecoratorNode, DecoratorData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<DecoratorData> = {}
): DecoratorNode => {
  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Decorator,
    scope,
    status,
    {
      target: entityData.target ?? DecoratorTargetValues.Unresolved, // Explicitly set a fallback for target
      arguments: entityData.arguments ?? [], // Ensure arguments is always an array
    },
    DecoratorDataSchema,
    location
  );
};
