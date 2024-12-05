/**
 * @fileoverview TypeScript Getter Node representation
 * Defines structure and behavior for property getters within TypeScript classes and interfaces.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import { GenericTypeReferenceSchema } from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";
import {
  createStructureMemberData,
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
 * Schema for GetterNode, extending TypeScriptNode with structure member data.
 * - `data`: Contains details specific to getters within class or interface structures, including:
 *   - `datatype`: The data type returned by the getter.
 *   - `modifiers`: Modifiers such as `static` or `abstract` for the getter.
 *   - `accessibility`: Accessibility level (e.g., public, private, protected).
 *   - `decorators`: Array of decorators applied to the getter.
 *
 * Examples:
 * - Public static getter: `public static get item(): Item`
 * - Protected getter with decorators: `@Log protected get details(): Details`
 */
export const GetterDataSchema = z
  .object({
    datatype: GenericTypeReferenceSchema.default({
      baseType: "unresolved",
      typeArguments: [],
    }),
    ...StructureMemberDataSchema.shape,
  })
  .strict();

export const GetterNodeSchema = TypeScriptNodeSchema(GetterDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Getter),
});

export type GetterData = z.infer<typeof GetterDataSchema>;
export type GetterNode = z.infer<typeof GetterNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTION FOR GETTER NODE
// =======================================================================================================

/**
 * Creates a validated GetterNode instance.
 *
 * Factory function that creates a getter node with its data type and member properties.
 * Uses GetterData to specify the return type and structure member properties like
 * accessibility, modifiers, and decorators.
 *
 * @example
 * ```typescript
 * const getterNode = createGetterNode(
 *   "getter1",
 *   "item",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/path/to/file.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 },
 *   {
 *     datatype: createGenericTypeReference("Item"),
 *     accessibility: MemberVisibilityValues.Public,
 *     modifiers: [ModifierValues.Static],
 *     decorators: ["Log"]
 *   }
 * );
 * ```
 */
export const createGetterNode: CreateNodeFn<GetterNode, GetterData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<GetterData>
): GetterNode => {
  const structureMemberData = createStructureMemberData({
    modifiers: entityData.modifiers,
    accessibility: entityData.accessibility,
    decorators: entityData.decorators,
  });

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Getter,
    scope,
    status,
    {
      datatype: entityData.datatype || {
        baseType: "unresolved",
        typeArguments: [],
      }, // Ensure a value
      ...structureMemberData,
    },
    GetterDataSchema,
    location
  ) as GetterNode;
};
