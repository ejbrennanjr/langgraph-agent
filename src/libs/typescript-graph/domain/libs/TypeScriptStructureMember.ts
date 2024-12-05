/**
 * @fileoverview TypeScript Structure Member representation
 * Defines shared characteristics for entities that are members of structures (e.g., classes, interfaces),
 * such as methods and properties.
 */

import { z } from "zod";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * Visibility modifiers for TypeScript members
 */
export enum MemberVisibilityValues {
  Private = "private",
  Protected = "protected",
  Public = "public",
}

export const MemberVisibilityValuesSchema = z.nativeEnum(
  MemberVisibilityValues
);

/**
 * Common modifiers applicable to structure members
 */
export enum ModifierValues {
  Readonly = "readonly",
  Optional = "optional",
  Abstract = "abstract",
  Static = "static",
}

export const ModifierValuesSchema = z.nativeEnum(ModifierValues);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for StructureMemberData, representing shared attributes among members of structures.
 * - `modifiers`: Array of type modifiers (e.g., readonly, static) applied to the structure member.
 * - `accessibility`: Accessibility level of the member (e.g., public, private).
 * - `decorators`: Array of decorators applied to the member.
 */
export const StructureMemberDataSchema = z
  .object({
    modifiers: z.array(ModifierValuesSchema).default([]),
    accessibility: MemberVisibilityValuesSchema.default(
      MemberVisibilityValues.Public
    ),
    decorators: z.array(z.string()).default([]),
  })
  .strict();

export type StructureMemberData = z.infer<typeof StructureMemberDataSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR STRUCTURE MEMBER DATA
// =======================================================================================================

/**
 * Creates data for a structure member with validation.
 *
 * @param modifiers - Optional array of modifiers applied to the member.
 * @param accessibility - Optional accessibility level of the member.
 * @param decorators - Optional array of decorators applied to the member.
 * @returns A validated `StructureMemberData`.
 */
export const createStructureMemberData = ({
  modifiers,
  accessibility,
  decorators,
}: Partial<StructureMemberData> = {}): StructureMemberData => {
  return StructureMemberDataSchema.parse({
    modifiers,
    accessibility,
    decorators,
  });
};
