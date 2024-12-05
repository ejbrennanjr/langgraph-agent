import { z } from "zod";
import {
  EdgeRelationshipTypeSchema,
  ExportScopeTypeSchema,
  NodeEntityTypeSchema,
} from "./enums";

// =======================================================================================================
// Graph Edge Schemas/Types
// =======================================================================================================

/**
 * Zod Schema for BaseEdgeSchema, representing the metadata associated with an edge in the graph.
 *
 * @property alias - An optional alias for the edge if applicable (used for named imports).
 * @property type - A string indicating the type of relationship represented by this edge.
 */
export const BaseEdgeSchema = z.object({
  alias: z.string().optional(), // Optional: Alias if applicable
  type: EdgeRelationshipTypeSchema, // Constrained to valid EdgeType values
});
export type BaseEdge = z.infer<typeof BaseEdgeSchema>;

// =======================================================================================================
// Graph Node Schemas/Types
// =======================================================================================================

/**
 * Zod schema for the base node structure in the graph.
 */
export const BaseNodeSchema = z.object({
  id: z.string(), // Unique identifier for the node
  name: z.string(), // Name of the entity (e.g., class name, method name)
  type: NodeEntityTypeSchema, // Enum for node types (class, method, file, etc.)
  scope: ExportScopeTypeSchema, // Enum for export scope
  isPlaceholder: z.boolean().default(false), // Indicates if the node is unresolved (default is false)
  metadata: z.record(z.any()).default({}), // Generic metadata for entity-specific details
});

// Derive the TypeScript type from the Zod schema
export type BaseNode = z.infer<typeof BaseNodeSchema>;

/**
 * Zod schema for a class node in the graph.
 * Extends the BaseNodeSchema with class-specific metadata, such as inheritance and interfaces.
 */
export const ClassNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      extends: z.string().optional(), // Name of the superclass, if any
      implements: z.array(z.string()).optional(), // List of interfaces implemented by the class
      methods: z.array(z.string()).optional(), // List of methods in the class
      properties: z.array(z.string()).optional(), // List of properties in the class
    })
    .default({}),
});

// Derive the TypeScript type for a ClassNode
export type ClassNode = z.infer<typeof ClassNodeSchema>;

/**
 * Zod schema for an enum node in the graph.
 * Extends the BaseNodeSchema without adding any additional metadata.
 */
export const EnumNodeSchema = BaseNodeSchema.extend({
  metadata: z.object({}).default({}), // Empty metadata for EnumNode
});

// Derive the TypeScript type for an EnumNode
export type EnumNode = z.infer<typeof EnumNodeSchema>;

/**
 * Zod schema for a file node in the graph.
 * Extends the BaseNodeSchema with any additional properties if needed (currently none).
 */
export const FileNodeSchema = BaseNodeSchema.extend({
  // No additional metadata for now, but we can extend this in the future if needed
});

// Derive the TypeScript type for a FileNode
export type FileNode = z.infer<typeof FileNodeSchema>;

/**
 * Zod schema for a function node in the graph.
 * Extends the BaseNodeSchema with function-specific metadata.
 */
export const FunctionNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      parameters: z.array(z.string()).optional(), // List of function parameters
      returnType: z.string().optional(), // Function return type
      isAsync: z.boolean().optional(), // Whether the function is asynchronous
    })
    .default({}),
});

// Derive the TypeScript type for a FunctionNode
export type FunctionNode = z.infer<typeof FunctionNodeSchema>;

/**
 * Zod schema for an interface node in the graph.
 * Extends the BaseNodeSchema with interface-specific metadata, such as inheritance and implementations.
 */
export const InterfaceNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      extends: z.array(z.string()).optional(), // List of interfaces this interface extends
      implements: z.array(z.string()).optional(), // List of interfaces this interface implements
      methods: z.array(z.string()).optional(), // List of methods in the interface
      properties: z.array(z.string()).optional(), // List of properties in the interface
    })
    .default({}),
});

// Derive the TypeScript type for an InterfaceNode
export type InterfaceNode = z.infer<typeof InterfaceNodeSchema>;

/**
 * Zod schema for a method node in the graph.
 * Extends the BaseNodeSchema with method-specific metadata.
 */
export const MethodNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      parameters: z.array(z.string()).optional(), // Method parameters
      returnType: z.string().optional(), // Method return type
      isStatic: z.boolean().optional(), // Whether the method is static
      visibility: z.enum(["public", "protected", "private"]).optional(), // Method visibility
      isAsync: z.boolean().optional(), // Whether the method is asynchronous
    })
    .default({}),
});

// Derive the TypeScript type for a MethodNode
export type MethodNode = z.infer<typeof MethodNodeSchema>;

/**
 * Zod schema for a property node in the graph.
 * Extends the BaseNodeSchema with property-specific metadata.
 */
export const PropertyNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      propertyType: z.string().optional(), // Property type (e.g., string, number)
      visibility: z.enum(["public", "protected", "private"]).optional(), // Property visibility
      isStatic: z.boolean().optional(), // Whether the property is static
      isReadonly: z.boolean().optional(), // Whether the property is read-only
    })
    .default({}),
});

// Derive the TypeScript type for a PropertyNode
export type PropertyNode = z.infer<typeof PropertyNodeSchema>;

/**
 * Zod schema for a type node in the graph.
 * Extends the BaseNodeSchema with type-specific metadata.
 */
export const TypeNodeSchema = BaseNodeSchema.extend({
  metadata: z.object({}).default({}), // Empty metadata for TypeNode).default({}),
});

// Derive the TypeScript type for a TypeNode
export type TypeNode = z.infer<typeof TypeNodeSchema>;

/**
 * Zod schema for a variable node in the graph.
 * Extends the BaseNodeSchema with variable-specific metadata.
 */
export const VariableNodeSchema = BaseNodeSchema.extend({
  metadata: z
    .object({
      declarationType: z.enum(["const", "let", "var"]).optional(), // Variable declaration type
      varType: z.string().optional(), // Variable type (e.g., string, number)
      isReadonly: z.boolean().optional(), // Whether the variable is read-only
    })
    .default({}),
});

// Derive the TypeScript type for a VariableNode
export type VariableNode = z.infer<typeof VariableNodeSchema>;
