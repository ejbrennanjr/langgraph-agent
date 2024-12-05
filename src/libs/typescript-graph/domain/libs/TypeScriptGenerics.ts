/**
 * @fileoverview TypeScriptGenerics - A combined module for managing TypeScript generic types.
 * Handles declarations, constraints, and type references with arguments.
 */

import { z } from "zod";
import {
  TypeScriptNativeTypes,
  TypeScriptNativeTypesSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * Enum defining types of constraints that can be applied to generic parameters.
 *
 * Example usages:
 * - `Extends`: `T extends SomeType`
 * - `Equals`: `T = DefaultType`
 * - `None`: `T` (no constraint)
 */
export enum GenericConstraintValues {
  Extends = "extends", // T extends Type
  Super = "super", // T super Type (less common in TypeScript)
  Equals = "equals", // T = DefaultType
  None = "none", // T (no constraint)
}

export const GenericConstraintValuesSchema = z.nativeEnum(
  GenericConstraintValues
);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for a single generic argument within a type reference.
 * Represents `T` or `U` in constructs like `Array<T>` or `Map<K, V>`.
 *
 * Fields:
 * - `parameterName`: Name of the generic parameter (e.g., `T`).
 * - `providedType`: The actual type provided for this parameter.
 *   - Could be a native TypeScript type (e.g., `string`, `number`) or a custom type name (`User`, `MyType`).
 *
 * Example:
 * For `Array<string>`, a `GenericArgument` would be:
 * ```
 * { parameterName: "T", providedType: "string" }
 * ```
 */
export const GenericArgumentSchema = z
  .object({
    parameterName: z.string(), // No default
    providedType: z
      .union([TypeScriptNativeTypesSchema, z.string()])
      .default(TypeScriptNativeTypes.Any),
  })
  .strict();

export type GenericArgument = z.infer<typeof GenericArgumentSchema>;

/**
 * Schema representing a reference to a generic type, like `Array<string>` or `Map<string, number>`.
 *
 * Fields:
 * - `baseType`: The main type being referenced (e.g., `Array` or `Map`).
 * - `typeArguments`: Array of `GenericArgument`s representing the arguments provided to `baseType`.
 *
 * Example:
 * For `Map<string, Array<number>>`, a `GenericTypeReference` would be:
 * ```
 * {
 *   baseType: "Map",
 *   typeArguments: [
 *     { parameterName: "K", providedType: "string" },
 *     { parameterName: "V", providedType: { baseType: "Array", typeArguments: [{ parameterName: "T", providedType: "number" }] } }
 *   ]
 * }
 * ```
 */
export const GenericTypeReferenceSchema = z
  .object({
    baseType: z
      .union([TypeScriptNativeTypesSchema, z.string()])
      .default(TypeScriptNativeTypes.Void),
    typeArguments: z.array(GenericArgumentSchema).default([]),
  })
  .strict();

export type GenericTypeReference = z.infer<typeof GenericTypeReferenceSchema>;

/**
 * Schema for a constraint applied to a generic parameter.
 * Used in constructs like `function<T extends SomeType>()`.
 *
 * Fields:
 * - `type`: Type of constraint (`extends`, `equals`, etc.).
 * - `value`: The type that provides the constraint, if applicable.
 *
 * Example:
 * For `T extends SomeType`, a `GenericConstraint` would be:
 * ```
 * { type: "extends", value: "SomeType" }
 * ```
 */
export const GenericConstraintSchema = z
  .object({
    type: GenericConstraintValuesSchema.default(GenericConstraintValues.None),
    value: z.union([TypeScriptNativeTypesSchema, z.string()]).optional(),
  })
  .strict();

export type GenericConstraint = z.infer<typeof GenericConstraintSchema>;

/**
 * Schema for declaring a generic parameter, used in function, class, or interface definitions.
 *
 * Fields:
 * - `name`: Name of the generic parameter (e.g., `T`).
 * - `constraint`: Constraint applied to the parameter, if any.
 * - `defaultType`: Default type if none is provided (e.g., `T = DefaultType`).
 *
 * Example:
 * For `class MyClass<T extends SomeType = DefaultType>`, a `GenericDeclaration` would be:
 * ```
 * {
 *   name: "T",
 *   constraint: { type: "extends", value: "SomeType" },
 *   defaultType: "DefaultType"
 * }
 * ```
 */
export const GenericDeclarationSchema = z
  .object({
    name: z.string(), // No default
    constraint: GenericConstraintSchema.default({
      type: GenericConstraintValues.None,
    }),
    defaultType: z
      .union([TypeScriptNativeTypesSchema, z.string()])
      .optional()
      .default(TypeScriptNativeTypes.Any),
  })
  .strict();

export type GenericDeclaration = z.infer<typeof GenericDeclarationSchema>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Creates a generic argument for use in a type reference.
 *
 * @param parameterName - Name of the generic parameter (e.g., `T`).
 * @param providedType - Type provided for the parameter (e.g., `string`, `User`).
 * @returns A `GenericArgument` object.
 *
 * Example:
 * ```
 * createGenericArgument("T", "string");
 * // Output: { parameterName: "T", providedType: "string" }
 * ```
 */
export const createGenericArgument = (
  parameterName: string,
  providedType: TypeScriptNativeTypes | string = TypeScriptNativeTypes.Any
): GenericArgument => ({
  parameterName,
  providedType,
});
/**
 * Creates a reference to a generic type, such as `Array<string>` or `Map<string, number>`.
 *
 * @param baseType - Primary type being referenced (e.g., `Array`).
 * @param typeArguments - Array of `GenericArgument`s representing the type arguments.
 * @returns A `GenericTypeReference` object.
 *
 * Example:
 * ```
 * createGenericTypeReference("Array", [createGenericArgument("T", "string")]);
 * // Output: { baseType: "Array", typeArguments: [{ parameterName: "T", providedType: "string" }] }
 * ```
 */
export const createGenericTypeReference = (
  baseType: TypeScriptNativeTypes | string = TypeScriptNativeTypes.Void,
  typeArguments: GenericArgument[] = []
): GenericTypeReference => ({
  baseType,
  typeArguments,
});

/**
 * Creates a constraint for a generic type parameter, such as `T extends SomeType`.
 *
 * @param type - Constraint type (e.g., `extends`).
 * @param value - Type that provides the constraint (e.g., `SomeType`).
 * @returns A `GenericConstraint` object.
 *
 * Example:
 * ```
 * createGenericConstraint(GenericConstraintValues.Extends, "SomeType");
 * // Output: { type: "extends", value: "SomeType" }
 * ```
 */
export const createGenericConstraint = (
  type: GenericConstraintValues = GenericConstraintValues.None,
  value?: TypeScriptNativeTypes | string
): GenericConstraint => ({
  type,
  ...(value && { value }),
});

/**
 * Creates a declaration for a generic parameter, such as `T` in `function<T>()`.
 *
 * @param name - The parameter name (e.g., `T`).
 * @param constraint - Optional constraint on the parameter (e.g., `extends SomeType`).
 * @param defaultType - Optional default type for the parameter.
 * @returns A `GenericDeclaration` object.
 *
 * Example:
 * ```
 * createGenericDeclaration("T", createGenericConstraint(GenericConstraintValues.Extends, "SomeType"), "DefaultType");
 * // Output: { name: "T", constraint: { type: "extends", value: "SomeType" }, defaultType: "DefaultType" }
 * ```
 */
export const createGenericDeclaration = (
  name: string,
  constraint: GenericConstraint = { type: GenericConstraintValues.None },
  defaultType: TypeScriptNativeTypes | string = TypeScriptNativeTypes.Any
): GenericDeclaration => ({
  name,
  constraint,
  defaultType,
});
