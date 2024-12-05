/**
 * @fileoverview TypeScript Interface Node representation
 * Defines structure and behavior for interface declarations in TypeScript,
 * including generics, extensions, and member information.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
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
 * Schema for InterfaceNode, extending TypeScriptNode with structure data specific to interfaces.
 * Interfaces can extend other interfaces and contain shared attributes like generics and member names.
 *
 * Examples:
 * - `interface IUser { ... }`
 * - `interface Service extends IBaseService, IOther { ... }`
 */
export const InterfaceDataSchema = z
  .object({
    ...StructureDataSchema.shape,
  })
  .strict();

export const InterfaceNodeSchema = TypeScriptNodeSchema(InterfaceDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Interface),
});

export type InterfaceData = z.infer<typeof InterfaceDataSchema>;
export type InterfaceNode = z.infer<typeof InterfaceNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR INTERFACE NODE
// =======================================================================================================

/**
 * Creates a validated InterfaceNode instance.
 *
 * Factory function that creates an interface node with its structure data.
 * Uses InterfaceData to specify generics, extensions, and member information.
 *
 * @example
 * ```typescript
 * const interfaceNode = createInterfaceNode(
 *   "interface1",
 *   "UserService",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     generics: [{ name: "T", constraint: { type: GenericConstraintValues.Extends, value: "Base" } }],
 *     extends: [createGenericTypeReference("BaseInterface")],
 *     memberNames: { methods: ["fetchData"], properties: ["userData"] }
 *   }
 * );
 * ```
 */
export const createInterfaceNode: CreateNodeFn<InterfaceNode, InterfaceData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<InterfaceData> = {}
): InterfaceNode => {
  const structureData = createStructureData(
    entityData.generics ?? [], // Explicitly default to empty array
    entityData.extends ?? [], // Explicitly default to empty array
    entityData.memberNames ?? { methods: [], properties: [] } // Explicitly default to empty methods and properties
  );

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Interface,
    scope,
    status,
    structureData,
    InterfaceDataSchema,
    location
  ) as InterfaceNode;
};
