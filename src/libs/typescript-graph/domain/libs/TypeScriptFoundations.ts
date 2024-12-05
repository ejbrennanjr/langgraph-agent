/**
 * @fileoverview Core TypeScript foundation types and utilities
 * Provides fundamental building blocks for TypeScript entity representations
 */

import { z } from "zod";

// =======================================================================================================
// SCOPE AND VISIBILITY
// =======================================================================================================

/**
 * Export scopes for TypeScript entities
 */
export enum TypeScriptExportValues {
  Default = "default export",
  Named = "named export",
  Internal = "internal",
  External = "external",
}

export const TypeScriptExportValuesSchema = z.nativeEnum(
  TypeScriptExportValues
);

// =======================================================================================================
// TYPE SYSTEM
// =======================================================================================================

/**
 * Native TypeScript types
 */
export enum TypeScriptNativeTypes {
  // Primitive Types
  Any = "any",
  Unknown = "unknown",
  Never = "never",
  Void = "void",
  Undefined = "undefined",
  Null = "null",

  // Numeric Types
  Number = "number",
  BigInt = "bigint",

  // Text Types
  String = "string",

  // Boolean Type
  Boolean = "boolean",

  // Object Types
  Object = "object",
  Array = "array",
  Tuple = "tuple",

  // Function Type
  Function = "function",

  // Union and Intersection
  Union = "union",
  Intersection = "intersection",

  // Special Types
  Symbol = "symbol",
  This = "this",
}

export const TypeScriptNativeTypesSchema = z.nativeEnum(TypeScriptNativeTypes);

// =======================================================================================================
// VALIDATION UTILITIES
// =======================================================================================================

/**
 * Standard validation issue levels
 */
export enum ValidationIssueLevel {
  Error = "error",
  Warning = "warning",
}

/**
 * Creates a standard validation issue for Zod refinements
 */
export function createValidationIssue(
  ctx: z.RefinementCtx,
  message: string,
  path: string[],
  level: ValidationIssueLevel = ValidationIssueLevel.Error
): void {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path,
    fatal: level === ValidationIssueLevel.Error,
  });
}

// =======================================================================================================
// COMMON SCHEMAS
// =======================================================================================================

// =======================================================================================================
// TYPE GUARDS
// =======================================================================================================
