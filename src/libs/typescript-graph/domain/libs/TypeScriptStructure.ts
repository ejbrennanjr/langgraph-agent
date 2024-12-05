/**
 * @fileoverview TypeScript Structure Data Schema
 * Provides a shared schema for defining structure data in TypeScript classes and interfaces,
 * covering generics, extensions, and metadata for properties and methods.
 */

import { z } from "zod";
import {
  GenericDeclarationSchema,
  GenericTypeReferenceSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";

// =======================================================================================================
// SCHEMA FOR STRUCTURE DATA
// =======================================================================================================

/**
 * StructureDataSchema represents shared data properties for TypeScript classes and interfaces.
 * - `generics`: Defines the generic parameters and constraints associated with the structure.
 * - `extends`: Represents references to any inherited classes or interfaces.
 * - `memberNames`: Convenience metadata containing lists of method and property names for easy reference.
 */
export const StructureDataSchema = z
  .object({
    generics: z.array(GenericDeclarationSchema).default([]),
    extends: z.array(GenericTypeReferenceSchema).default([]),
    memberNames: z
      .object({
        methods: z.array(z.string()).default([]),
        properties: z.array(z.string()).default([]),
      })
      .default({ methods: [], properties: [] }),
  })
  .strict();

export type StructureData = z.infer<typeof StructureDataSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR STRUCTURE DATA
// =======================================================================================================

/**
 * Creates StructureData for a TypeScript structure (class or interface).
 *
 * @param generics - Generic declarations and constraints associated with the structure.
 * @param extendsReferences - Array of type references representing classes or interfaces being extended.
 * @param memberNames - Convenience metadata listing the names of methods and properties.
 * @returns A validated `StructureData` object.
 *
 * Example Usage:
 * ```typescript
 * const structureData = createStructureData(
 *   [{ name: "T", constraint: { type: GenericConstraintValues.Extends, value: "Base" } }],
 *   [createGenericTypeReference("BaseClass")],
 *   { methods: ["calculate"], properties: ["value"] }
 * );
 * ```
 */
export const createStructureData = (
  generics?: StructureData["generics"],
  extendsReferences?: StructureData["extends"],
  memberNames?: StructureData["memberNames"]
): StructureData => {
  return StructureDataSchema.parse({
    generics,
    extends: extendsReferences,
    memberNames,
  });
};
