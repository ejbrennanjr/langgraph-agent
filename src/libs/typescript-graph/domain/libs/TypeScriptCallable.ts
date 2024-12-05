/**
 * @fileoverview TypeScript callable entity representation
 * Defines structure and behavior for function-like entities, including functions, methods, and constructors.
 */

import { z } from "zod";
import {
  GenericDeclarationSchema,
  GenericTypeReferenceSchema,
} from "@/libs/typescript-graph/domain/libs/TypeScriptGenerics";
import { TypeScriptNativeTypes } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * Execution capabilities of callable entities.
 * - `Sync`: Regular synchronous execution.
 * - `Async`: Asynchronous execution, expected to return a `Promise`.
 * - `Generator`: Execution as a generator function, returning an iterator.
 * - `AsyncGenerator`: Asynchronous generator, returning an async iterator.
 */
export enum CallableCapabilityValues {
  Sync = "sync",
  Async = "async",
  Generator = "generator",
  AsyncGenerator = "async_generator",
}

export const CallableCapabilityValuesSchema = z.nativeEnum(
  CallableCapabilityValues
);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for parameters in callable entities (e.g., functions, methods).
 * Models parameters for functions, methods, and constructors with attributes that define type, modifiers, etc.
 * - `name`: The parameter's name.
 * - `type`: The type of the parameter, defined by `GenericTypeReferenceSchema`.
 * - `isRest`: Marks if this parameter is a rest parameter (e.g., `...args`).
 * - `isOptional`: Marks if this parameter is optional (e.g., `param?`).
 * - `defaultValue`: Optional default value if the parameter is not provided.
 *
 * Examples:
 * - `arg1: string` -> `{ name: "arg1", type: "string" }`
 * - `...args: any[]` -> `{ name: "args", type: "any[]", isRest: true }`
 */
export const ParameterSchema = z
  .object({
    name: z
      .string()
      .min(1, "Parameter name must contain at least one character"),
    type: GenericTypeReferenceSchema,
    isRest: z.boolean().default(false),
    isOptional: z.boolean().default(false),
    defaultValue: z.string().optional().default(""),
    decorators: z.array(z.string()).default([]),
  })
  .strict();

export type Parameter = z.infer<typeof ParameterSchema>;

/**
 * Schema for data specific to callable entities (e.g., functions, methods).
 * Models the core attributes for callables, including parameters, return type, generics, and capability.
 * - `parameters`: Array of parameters defined for the callable.
 * - `returnType`: The return type of the callable, using `GenericTypeReferenceSchema`.
 * - `generics`: Array of generic declarations (e.g., `T`, `U`).
 * - `capability`: Execution capability, which includes options like `sync`, `async`, `generator`.
 *
 * Examples:
 * - Synchronous function: `function sum(a: number, b: number): number`
 * - Async function: `async function fetchData(url: string): Promise<Response>`
 * - Generator function: `function* sequence(): Generator<number>`
 * - Method with generics: `public async fetch<T>(id: string): Promise<T>`
 */
export const CallableDataSchema = z
  .object({
    parameters: z.array(ParameterSchema).default([]),
    returnType: GenericTypeReferenceSchema, // defaults to void per GenericTypeReferenceSchema
    generics: z.array(GenericDeclarationSchema).default([]),
    capability: CallableCapabilityValuesSchema.default(
      CallableCapabilityValues.Sync
    ),
  })
  .strict();

export type CallableData = z.infer<typeof CallableDataSchema>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Creates a parameter for a callable entity with validation.
 * - Example: `{ name: "item", type: createGenericTypeReference("string") }`
 * - Example with optional: `{ name: "data", type: createGenericTypeReference("Data"), isOptional: true }`
 *
 * @param name - Name of the parameter.
 * @param type - Type of the parameter, defined using `GenericTypeReferenceSchema`.
 * @param options - Optional settings, including `isRest`, `isOptional`, and `defaultValue`.
 * @returns A validated `Parameter`.
 */
export const createParameter = (
  name: string,
  type: z.infer<typeof GenericTypeReferenceSchema>,
  options: {
    isRest?: boolean;
    isOptional?: boolean;
    defaultValue?: string;
    decorators?: string[];
  } = {}
): Parameter => {
  return ParameterSchema.parse({
    name,
    type,
    ...options, // Let ParameterSchema defaults handle missing values
  });
};

/**
 * Creates a callable data instance with validation, encapsulating parameters, return type, and capabilities.
 * - Example: Synchronous function with parameters `{ returnType: createGenericTypeReference("number"), parameters: [...] }`
 * - Example with async capability: `{ returnType: createGenericTypeReference("Promise"), capability: CallableCapabilityValues.Async, parameters: [...] }`
 *
 * @param returnType - The return type of the callable.
 * @param options - Optional settings, including `parameters`, `generics`, and `capability`.
 * @returns A validated `CallableData`.
 */
export const createCallableData = (
  returnType?: z.infer<typeof GenericTypeReferenceSchema>,
  options: {
    parameters?: CallableData["parameters"];
    generics?: CallableData["generics"];
    capability?: CallableCapabilityValues;
  } = {}
): CallableData => {
  return CallableDataSchema.parse({
    returnType: returnType ?? {
      baseType: TypeScriptNativeTypes.Void,
      typeArguments: [],
    },
    ...options,
  });
};
