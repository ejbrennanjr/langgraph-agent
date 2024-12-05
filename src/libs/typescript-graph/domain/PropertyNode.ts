/**
 * @fileoverview TypeScript Property Node representation
 * Defines structure and behavior for properties in classes and interfaces.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { GenericTypeReferenceSchema } from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";
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
 * Schema for PropertyNode, extending TypeScriptNode with structure member data.
 * - `data`: Combines properties specific to properties in class or interface structures, including:
 *   - `datatype`: The data type of the property.
 *   - `modifiers`: Modifiers like `readonly` for the property.
 *   - `accessibility`: Accessibility level (e.g., public, private, protected).
 *   - `hasGetter`: Indicates if a getter is present for the property.
 *   - `hasSetter`: Indicates if a setter is present for the property.
 *   - `decorators`: Array of decorators applied to the property.
 *
 * Examples:
 * - Public readonly property with getter: `public readonly name: string`
 * - Private property with setter: `private set _value(val: number) { ... }`
 */
export const PropertyDataSchema = z
  .object({
    datatype: GenericTypeReferenceSchema.optional().default({
      baseType: "unresolved",
      typeArguments: [],
    }),
    hasGetter: z.boolean().default(false),
    hasSetter: z.boolean().default(false),
    ...StructureMemberDataSchema.shape,
  })
  .strict();

export const PropertyNodeSchema = TypeScriptNodeSchema(PropertyDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Property),
});

export type PropertyData = z.infer<typeof PropertyDataSchema>;
export type PropertyNode = z.infer<typeof PropertyNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR PROPERTY NODE
// =======================================================================================================

/**
 * Creates a validated PropertyNode instance.
 *
 * Factory function that creates a property node with its data type and member properties.
 * Uses PropertyData to specify the data type, accessibility, modifiers,
 * decorators, and getter/setter presence.
 *
 * @example
 * ```typescript
 * const propertyNode = createPropertyNode(
 *   "prop1",
 *   "count",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     datatype: createGenericTypeReference("number"),
 *     accessibility: MemberVisibilityValues.Public,
 *     modifiers: [ModifierValues.Readonly],
 *     decorators: [],
 *     hasGetter: true,
 *     hasSetter: false
 *   }
 * );
 * ```
 */
export const createPropertyNode: CreateNodeFn<PropertyNode, PropertyData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<PropertyData>
): PropertyNode => {
  const structureMemberData = createStructureMemberData({
    modifiers: entityData.modifiers ?? [],
    accessibility: entityData.accessibility ?? MemberVisibilityValues.Public,
    decorators: entityData.decorators ?? [],
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Property,
    scope,
    status,
    {
      datatype: entityData.datatype ?? {
        baseType: "unresolved",
        typeArguments: [],
      }, // Ensure datatype is defined
      hasGetter: entityData.hasGetter ?? false, // Explicitly set default for hasGetter
      hasSetter: entityData.hasSetter ?? false, // Explicitly set default for hasSetter
      ...structureMemberData,
    },
    PropertyDataSchema,
    location
  ) as PropertyNode;
};
