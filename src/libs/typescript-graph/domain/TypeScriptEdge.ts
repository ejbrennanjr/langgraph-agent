/**
 * @fileoverview TypeScript edge representation and relationships
 * Defines the connections and relationships between TypeScript entities
 */

import { z } from "zod";

import { EdgeSchema } from "@/libs/graph/domain/Edge";

// =======================================================================================================
// ENUMS
// =======================================================================================================

/**
 * @fileoverview TypeScript edge relationship values
 * Defines the allowed relationships between nodes in the TypeScript graph
 * following a consistent naming convention.
 *
 * Relationship Naming Convention:
 * SourceModule* - Relationships originating from the module being analyzed
 * ReferencedModule* - Relationships from modules discovered in imports
 * Entity* - Relationships between entities (for future entity analysis)
 */
export enum TypeScriptEdgeRelationshipValues {
  // Module Relationships
  ModuleImportsNamed = "module imports named", // import { x } from 'module'
  ModuleImportsDefault = "module imports default", // import x from 'module'
  ModuleImportsNamespace = "module imports namespace", // import * as x from 'module'
  ModuleDependsOn = "module depends on", // Dependency on referenced module
  ModuleExportsDefault = "module exports default", // export default x
  ModuleExportsNamed = "module exports named", // export function x() {}
  ModuleReExports = "module re-exports", // export * from 'module'

  // Entity Relationships (for future entity analysis)
  EntityExtends = "entity extends", // Class/Interface inheritance
  EntityImplements = "entity implements", // Class implements interface
  EntityHasMethod = "entity has method", // Class/Interface method
  EntityHasProperty = "entity has property", // Class/Interface property
  EntityDecorated = "entity decorated", // Entity has decorator
  EntityUses = "entity uses", // Entity uses another entity
}

export const TypeScriptEdgeRelationshipValuesSchema = z.nativeEnum(
  TypeScriptEdgeRelationshipValues
);

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

/**
 * TypeScriptEdgeSchema
 *
 * Extends the base EdgeSchema with a required label field constrained by TypeScriptEdgeRelationshipValues.
 * Defines the structure for a "TypeScriptEdge" in the graph, representing relationships specific to TypeScript.
 *
 * The schema enforces:
 * - `id` (string): A unique identifier for the edge.
 * - `source` (string): The source node ID.
 * - `target` (string): The target node ID.
 * - `label` (TypeScriptEdgeRelationshipValues): A required label specifying the relationship type.
 *
 * @returns A Zod schema for a TypeScriptEdge object.
 */
export const TypeScriptEdgeSchema = () =>
  EdgeSchema()
    .extend({
      label: TypeScriptEdgeRelationshipValuesSchema, // Required label aligned with the enum
    })
    .strict();

/**
 * TypeScriptEdge Type Definition
 *
 * Represents the TypeScript type for an edge object as defined by TypeScriptEdgeSchema.
 * Ensures consistent structure and type safety for edge objects adhering to TypeScriptEdge format.
 */
export type TypeScriptEdge = z.infer<ReturnType<typeof TypeScriptEdgeSchema>>;

// =======================================================================================================
// FACTORY FUNCTIONS
// =======================================================================================================

/**
 * Factory function for creating TypeScriptEdge instances
 *
 * This function simplifies the creation of `TypeScriptEdge` objects by enforcing
 * required fields and validating them against the TypeScriptEdgeSchema.
 *
 * @param id - A unique string identifier for the edge.
 * @param source - The source node ID in the graph.
 * @param target - The target node ID in the graph.
 * @param label - The label describing the edge type, constrained by the TypeScriptEdgeRelationshipValues enum.
 * @returns A validated `TypeScriptEdge` object adhering to the schema.
 * @throws ZodError if the provided arguments do not satisfy the schema.
 */
export const createTypeScriptEdge = (
  id: string,
  source: string,
  target: string,
  label: TypeScriptEdgeRelationshipValues
): TypeScriptEdge => {
  const edge = { id, source, target, label };
  return TypeScriptEdgeSchema().parse(edge); // Validates and returns the edge
};

// =======================================================================================================
// TYPE GUARD FUNCTIONS
// =======================================================================================================

/**
 * Type guard function to check if an object is a TypeScriptEdge
 *
 * This function verifies if an object matches the structure defined by TypeScriptEdgeSchema.
 *
 * @param edge - The object to check.
 * @returns `true` if the object is a valid TypeScriptEdge, `false` otherwise.
 */
export function isTypeScriptEdge(edge: unknown): edge is TypeScriptEdge {
  return TypeScriptEdgeSchema().safeParse(edge).success;
}
