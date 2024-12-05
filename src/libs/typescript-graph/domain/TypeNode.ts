/**
 * @fileoverview TypeScript Type Node representation
 * Defines structure and behavior for TypeScript type definitions and aliases.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  GenericDeclarationSchema,
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
 * Enum for different kinds of type definitions in TypeScript
 */
export enum TypeDefinitionKind {
  Alias = "alias", // type A = string
  Union = "union", // type A = string | number
  Intersection = "intersection", // type A = B & C
  Mapped = "mapped", // type A = { [K in keyof B]: B[K] }
  Conditional = "conditional", // type A = B extends C ? D : E
  Literal = "literal", // type A = "specific" | 1 | true
  Tuple = "tuple", // type A = [string, number]
  KeyOf = "keyof", // type A = keyof B
  Indexed = "indexed", // type A = B[K]
  Inferred = "inferred", // type A = infer T
  Template = "template", // type A = `prefix-${string}`
  Object = "object", // type A = { prop: string }
  Unresolved = "unresolved", // type A = B (unresolved)
}

export const TypeDefinitionKindSchema = z.nativeEnum(TypeDefinitionKind);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for type literal values that can appear in union types or as standalone types
 */
export const TypeLiteralValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
]);

export type TypeLiteralValue = z.infer<typeof TypeLiteralValueSchema>;

/**
 * Schema for object property definitions
 */
export const ObjectPropertySchema = z
  .object({
    name: z.string(),
    type: GenericTypeReferenceSchema,
    optional: z.boolean().default(false),
    readonly: z.boolean().default(false),
  })
  .strict();

export type ObjectProperty = z.infer<typeof ObjectPropertySchema>;

/**
 * Schema for mapped type parameters
 */
export const MappedTypeParamSchema = z
  .object({
    keyType: GenericTypeReferenceSchema,
    as: GenericTypeReferenceSchema.optional(),
    optional: z.boolean().default(false),
    readonly: z.boolean().default(false),
  })
  .strict();

export type MappedTypeParam = z.infer<typeof MappedTypeParamSchema>;

/**
 * Schema for conditional type components
 */
export const ConditionalTypeSchema = z
  .object({
    checkType: GenericTypeReferenceSchema,
    extendsType: GenericTypeReferenceSchema,
    trueType: GenericTypeReferenceSchema,
    falseType: GenericTypeReferenceSchema,
  })
  .strict();

export type ConditionalType = z.infer<typeof ConditionalTypeSchema>;

/**
 * Schema for TypeNode data
 */
export const TypeDataSchema = z
  .object({
    kind: TypeDefinitionKindSchema.default(TypeDefinitionKind.Unresolved), // Default to Unresolved
    generics: z.array(GenericDeclarationSchema).default([]),
    baseType: GenericTypeReferenceSchema.optional(),
    unionTypes: z.array(GenericTypeReferenceSchema).optional(),
    intersectionTypes: z.array(GenericTypeReferenceSchema).optional(),
    mappedParams: MappedTypeParamSchema.optional(),
    conditionalType: ConditionalTypeSchema.optional(),
    literalValues: z.array(TypeLiteralValueSchema).optional(),
    tupleTypes: z.array(GenericTypeReferenceSchema).optional(),
    keyofType: GenericTypeReferenceSchema.optional(),
    indexedType: z
      .object({
        objectType: GenericTypeReferenceSchema,
        indexType: GenericTypeReferenceSchema,
      })
      .optional(),
    inferredType: z.string().optional(),
    templateParts: z
      .array(z.union([z.string(), GenericTypeReferenceSchema]))
      .optional(),
    properties: z.array(ObjectPropertySchema).optional(), // New field for object properties
  })
  .strict();

export const TypeNodeSchema = TypeScriptNodeSchema(TypeDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Type),
});

export type TypeData = z.infer<typeof TypeDataSchema>;
export type TypeNode = z.infer<typeof TypeNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR TYPE NODE
// =======================================================================================================

/**
 * Creates a validated TypeNode instance.
 *
 * Factory function that creates a type node with its kind and various type-specific
 * properties. The type of data required depends on the kind of type being created.
 *
 * @example Alias Type
 * ```typescript
 * const aliasTypeNode = createTypeNode(
 *   "type1",
 *   "UserID",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     kind: TypeDefinitionKind.Alias,
 *     baseType: createGenericTypeReference("string")
 *   }
 * );
 * ```
 *
 * @example Union Type
 * ```typescript
 * const unionTypeNode = createTypeNode(
 *   "type2",
 *   "Status",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     kind: TypeDefinitionKind.Union,
 *     unionTypes: [
 *       createGenericTypeReference("'success'"),
 *       createGenericTypeReference("'error'")
 *     ]
 *   }
 * );
 * ```
 *
 * @example Object Type with Properties
 * ```typescript
 * const objectTypeNode = createTypeNode(
 *   "type3",
 *   "User",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     kind: TypeDefinitionKind.Object,
 *     properties: [
 *       createObjectProperty("id", createGenericTypeReference("string")),
 *       createObjectProperty("name", createGenericTypeReference("string"))
 *     ]
 *   }
 * );
 * ```
 */
export const createTypeNode: CreateNodeFn<TypeNode, TypeData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<TypeData> = {} // Allow all fields to be optional
): TypeNode => {
  const typeData: TypeData = {
    kind: entityData.kind ?? TypeDefinitionKind.Unresolved, // Default to Unresolved if kind is undefined
    generics: entityData.generics ?? [],
    baseType: entityData.baseType,
    unionTypes: entityData.unionTypes ?? [],
    intersectionTypes: entityData.intersectionTypes ?? [],
    mappedParams: entityData.mappedParams,
    conditionalType: entityData.conditionalType,
    literalValues: entityData.literalValues ?? [],
    tupleTypes: entityData.tupleTypes ?? [],
    keyofType: entityData.keyofType,
    indexedType: entityData.indexedType,
    inferredType: entityData.inferredType,
    templateParts: entityData.templateParts ?? [],
    properties: entityData.properties ?? [],
  };

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Type,
    scope,
    status,
    typeData,
    TypeDataSchema,
    location
  ) as TypeNode;
};

// Keep createObjectProperty helper function unchanged
export const createObjectProperty = (
  name: string,
  type: z.infer<typeof GenericTypeReferenceSchema>,
  options: {
    optional?: boolean;
    readonly?: boolean;
  } = {}
): ObjectProperty => ({
  name,
  type,
  optional: options.optional ?? false,
  readonly: options.readonly ?? false,
});
