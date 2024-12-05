/**
 * @fileoverview TypeScript Module Node representation
 * Defines structure and behavior for TypeScript modules, representing source files
 * and their imports and exports, including detailed handling of named exports,
 * re-exports, wildcard exports, and default exports.
 */

import { z } from "zod";

import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";

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
 * Types of TypeScript modules
 */
export enum ModuleKind {
  ES6 = "es6", // ES6 module with imports/exports
  Namespace = "namespace", // TypeScript namespace
  Ambient = "ambient", // Ambient module declaration
  Unresolved = "unresolved", // Unresolved module
}

export const ModuleKindSchema = z.nativeEnum(ModuleKind);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * Schema for named imports, which may include an alias.
 */
export const NamedImportSchema = z
  .object({
    modulePath: z.string(),
    name: z.string(),
    alias: z.string().nullable().default(null), // Set default to null for optional aliasing
  })
  .strict();

export type NamedImport = z.infer<typeof NamedImportSchema>;

/**
 * Schema for namespace imports, which must have a module path and alias.
 */
export const NamespaceImportSchema = z
  .object({
    modulePath: z.string(),
    alias: z.string().default("namespace"), // Default value for alias
  })
  .strict();

export type NamespaceImport = z.infer<typeof NamespaceImportSchema>;

/**
 * Schema for default imports, which have a module path and optional alias.
 */
export const DefaultImportSchema = z
  .object({
    modulePath: z.string(),
    alias: z.string().nullable().default(null), // Set default to null for optional aliasing
  })
  .strict();

export type DefaultImport = z.infer<typeof DefaultImportSchema>;

/**
 * Schema for exported entity references, including support for named and aliased exports.
 */
export const ExportedEntitySchema = z
  .object({
    exportedName: z.string(), // Name as exported from the module
    localName: z.string(), // Local name of the entity in the module
    source: z.string().optional(), // Source module path for re-exports
  })
  .strict();

export type ExportedEntity = z.infer<typeof ExportedEntitySchema>;

/**
 * Schema for re-exports, representing entities exported from another module with optional aliasing.
 */
export const ReExportSchema = z
  .object({
    source: z.string(), // Source path of the re-exported module
    name: z.string(), // Name of the entity in the source module
    alias: z.string().optional(), // Optional alias for the re-exported entity
  })
  .strict();

export type ReExport = z.infer<typeof ReExportSchema>;

/**
 * Schema for ModuleNode data.
 * Defines structure for imports and exports to capture all anticipated export types.
 */
export const ModuleDataSchema = z
  .object({
    path: z.string().default("unresolved"), // File path of the module
    moduleKind: ModuleKindSchema.default(ModuleKind.Unresolved), // Set default to Unresolved

    // Import references
    imports: z
      .object({
        named: z.array(NamedImportSchema).default([]), // Named imports array
        namespaces: z.array(NamespaceImportSchema).default([]), // Namespace imports array
        defaults: z.array(DefaultImportSchema).default([]), // Default imports array
      })
      .default({
        named: [],
        namespaces: [],
        defaults: [],
      }),

    // Export references
    exports: z
      .object({
        named: z.array(ExportedEntitySchema).default([]), // Named exports with optional aliasing
        reExports: z.array(ReExportSchema).default([]), // Re-exports with optional aliasing
        wildcards: z.array(z.string()).default([]), // Wildcard exports as paths only
        default: ExportedEntitySchema.optional(), // Optional default export
      })
      .default({
        named: [],
        reExports: [],
        wildcards: [],
      }),
  })
  .strict();

export const ModuleNodeSchema = TypeScriptNodeSchema(ModuleDataSchema, {
  type: z.literal(TypeScriptNodeTypes.Module),
});

export type ModuleData = z.infer<typeof ModuleDataSchema>;
export type ModuleNode = z.infer<typeof ModuleNodeSchema>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Factory function for creating a named import.
 *
 * @param modulePath - The path to the imported module
 * @param name - The name of the imported entity
 * @param alias - An optional alias for the imported entity
 * @returns A validated NamedImport object
 */
export const createNamedImport = (
  modulePath: string,
  name: string,
  alias?: string | null
): NamedImport => {
  return NamedImportSchema.parse({ modulePath, name, alias });
};

/**
 * Factory function for creating a namespace import.
 *
 * @param modulePath - The path to the imported module
 * @param alias - An alias for the namespace import (default is "namespace")
 * @returns A validated NamespaceImport object
 */
export const createNamespaceImport = (
  modulePath: string,
  alias: string = "namespace" // Default value for alias
): NamespaceImport => {
  return NamespaceImportSchema.parse({ modulePath, alias });
};

/**
 * Factory function for creating a default import.
 *
 * @param modulePath - The path to the imported module
 * @param alias - An optional alias for the default import
 * @returns A validated DefaultImport object
 */
export const createDefaultImport = (
  modulePath: string,
  alias?: string | null
): DefaultImport => {
  return DefaultImportSchema.parse({ modulePath, alias });
};

/**
 * Factory function for creating an exported entity.
 *
 * @param exportedName - The name as it is exported from the module
 * @param localName - The local name of the entity in the module
 * @param source - Optional source module path for re-exports
 * @returns A validated ExportedEntity object
 */
export const createExportedEntity = (
  exportedName: string,
  localName: string,
  source?: string
): ExportedEntity => {
  return ExportedEntitySchema.parse({ exportedName, localName, source });
};

/**
 * Factory function for creating a re-export.
 *
 * @param source - The source module path for the re-exported entity
 * @param name - The name of the entity in the source module
 * @param alias - An optional alias for the re-exported entity
 * @returns A validated ReExport object
 */
export const createReExport = (
  source: string,
  name: string,
  alias?: string
): ReExport => {
  return ReExportSchema.parse({ source, name, alias });
};

/**
 * Creates a validated ModuleNode instance.
 *
 * Factory function that creates a module node with its path, kind, and import/export
 * declarations. Uses ModuleData to specify the module's structure including all imports
 * and exports.
 *
 * @example ES6 Module with Imports and Exports
 * ```typescript
 * const moduleNode = createModuleNode(
 *   "module1",
 *   "userService",
 *   TypeScriptExportValues.Internal,
 *   TypeScriptNodeStatus.Resolved,
 *   { filePath: "/src/userService.ts", startLine: 1, startColumn: 1, endLine: 100, endColumn: 1 },
 *   {
 *     path: "/src/userService.ts",
 *     moduleKind: ModuleKind.ES6,
 *     imports: {
 *       named: [{ modulePath: "./models", name: "User", alias: "UserModel" }],
 *       namespaces: [{ modulePath: "./utils", alias: "utils" }],
 *       defaults: [{ modulePath: "./service", alias: "defaultService" }]
 *     },
 *     exports: {
 *       named: [{ exportedName: "UserService", localName: "UserService" }],
 *       reExports: [{ source: "./utils", name: "Helper", alias: "UtilityHelper" }],
 *       wildcards: ["./helpers"],
 *       default: { exportedName: "default", localName: "UserService" }
 *     }
 *   }
 * );
 * ```
 */
export const createModuleNode: CreateNodeFn<ModuleNode, ModuleData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues = TypeScriptExportValues.Internal,
  status: TypeScriptNodeStatus = TypeScriptNodeStatus.Resolved,
  location: SourceLocation,
  entityData: Partial<ModuleData> = {}
): ModuleNode => {
  const moduleData: ModuleData = {
    path: entityData.path ?? "",
    moduleKind: entityData.moduleKind ?? ModuleKind.Unresolved,

    imports: {
      named: entityData.imports?.named ?? [],
      namespaces: entityData.imports?.namespaces ?? [],
      defaults: entityData.imports?.defaults ?? [],
    },

    exports: {
      named: entityData.exports?.named ?? [],
      reExports: entityData.exports?.reExports ?? [],
      wildcards: entityData.exports?.wildcards ?? [],
      default: entityData.exports?.default,
    },
  };

  return createTypeScriptNode(
    id,
    name,
    TypeScriptNodeTypes.Module,
    scope,
    status,
    moduleData,
    ModuleDataSchema,
    location
  ) as ModuleNode;
};
