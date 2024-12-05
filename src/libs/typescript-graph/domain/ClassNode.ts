/**
 * @fileoverview TypeScript Class Node representation
 *
 * This module defines the structure and factory function for class nodes in the TypeScript graph.
 * Classes are complex structures that can include generics, inheritance, implementations,
 * decorators, and various members (methods, properties, constructors).
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { GenericTypeReferenceSchema } from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";
import {
  createStructureData,
  StructureDataSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptStructure";

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
 * Schema for class-specific data, extending the base structure data.
 * All fields are optional with appropriate defaults.
 */
export const ClassDataSchema = z
  .object({
    ...StructureDataSchema.shape,
    decorators: z.array(z.string()).default([]),
    implements: z.array(GenericTypeReferenceSchema).default([]),
    constructors: z.array(z.string()).default([]),
  })
  .strict();

export const ClassNodeSchema = TypeScriptNodeSchema(ClassDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Class),
});

export type ClassData = z.infer<typeof ClassDataSchema>;
export type ClassNode = z.infer<typeof ClassNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR CLASS NODE
// =======================================================================================================

/**
 * Creates a validated ClassNode instance.
 *
 * Factory function that creates a class node with all its optional fields.
 * Uses ClassData to specify class-specific properties like generics,
 * inheritance, implementations, and member information.
 *
 * @example
 * ```typescript
 * const classNode = createClassNode(
 *   "class1",
 *   "UserService",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/service.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     generics: [{ name: "T", constraint: { type: GenericConstraintValues.Extends, value: "Base" } }],
 *     extends: [createGenericTypeReference("BaseClass")],
 *     memberNames: { methods: ["calculate"], properties: ["value"] },
 *     implements: [createGenericTypeReference("ServiceInterface")],
 *     decorators: ["Component"],
 *     constructors: ["UserService"]
 *   }
 * );
 * ```
 */
export const createClassNode: CreateNodeFn<ClassNode, ClassData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<ClassData> = {}
): ClassNode => {
  const classData: ClassData = {
    ...createStructureData(
      entityData.generics,
      entityData.extends,
      entityData.memberNames
    ),
    decorators: entityData.decorators ?? [],
    implements: entityData.implements ?? [],
    constructors: entityData.constructors ?? [],
  };

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Class,
    scope,
    status,
    classData,
    ClassDataSchema,
    location
  ) as ClassNode;
};
