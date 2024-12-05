import { z } from "zod";

/**
 * Common attributes associated with edges in the graph.
 * This enum can be expanded with additional attributes as needed.
 */
export enum EdgeMetadataAttribute {
  Alias = "alias", // Example: Alias for imports
  Type = "type", // The type of relationship, using EdgeType values
}

// Zod schema for EdgeMetadataAttribute enum values
export const EdgeMetadataAttributeSchema = z.nativeEnum(EdgeMetadataAttribute);

/**
 * Enum representing the various types of relationships (edges) in the graph.
 *
 * @enum {string}
 * @property Contains - Represents a containment relationship between nodes (e.g., a class contains a method).
 * @property DecoratedBy - Represents a relationship where a node is decorated by another node.
 * @property Exports - Represents an export relationship from one module to another.
 * @property Extends - Represents a class inheritance relationship.
 * @property Implements - Represents an interface implementation relationship.
 * @property ImportsNamed - Represents a named import relationship between modules.
 */
export enum EdgeRelationshipType {
  Contains = "contains",
  DecoratedBy = "decorated by",
  DefinedIn = "defined in",
  Exports = "exports",
  Extends = "extends",
  Implements = "implements",
  ImportsNamed = "imports named",
}

// Zod schema for EdgeRelationshipType enum values
export const EdgeRelationshipTypeSchema = z.nativeEnum(EdgeRelationshipType);

/**
 * Type representing the export scope of a node within the graph.
 *
 * @type "default export" - The node is the module's default export.
 * @type "named export" - The node is explicitly exported by name.
 * @type "internal" - The node is not exported and is internal to the module.
 */
export enum ExportScopeType {
  Default = "default export",
  Named = "named export",
  Internal = "internal",
}

// Zod schema for ExportScope enum values
export const ExportScopeTypeSchema = z.nativeEnum(ExportScopeType);

/**
 * Enum to represent special cases for file paths, such as unresolved files.
 * @enum {string}
 * @property Unresolved - Represents an unresolved file path.
 */
export enum FilePathType {
  Unresolved = "unresolved",
}

// Zod schema for FilePathType enum values
export const FilePathTypeSchema = z.nativeEnum(FilePathType);

/**
 * Enum representing the various entity types of nodes that can exist in the graph.
 *
 * @enum {string}
 *  * @property Class - Represents an class definition.
 *    Typically used to define a blueprint for creating objects with shared characteristics.
 *    Example: `class MyClass {  }`
 * @property File - Represents a file in the codebase.
 *   Typically used to represent a TypeScript source file or a module within the codebase.
 * @property Interface - Represents an interface definition.
 *    Typically used to define a contract for other classes or objects to implement.
 *    Example: `interface MyInterface {  }`
 * @property Method - Represents a method within a class or an object.
 *    Typically associated with behavior or functionality and can have parameters and a return type.
 *    Example: `class MyClass { myMethod(param: string): void {  } }`
 * @property Property - Represents a property of a class or an object.
 *    Typically associated with state or characteristics of the object or class.
 *    Example: `class MyClass { myProperty: string = "value"; }`
 * @property Variable - Represents a variable declaration.
 *    Can be a standalone variable or one that exists within a class or function scope.
 *    The type can be specified as const, let, or var.
 *    Example: `const myVariable = 42;`
 */
export enum NodeEntityType {
  Class = "class",
  Decorator = "decorator",
  Enum = "enum",
  File = "file",
  Function = "function",
  Interface = "interface",
  Method = "method",
  Property = "property",
  Type = "type",
  Variable = "variable",
}

// Zod schema for NodeEntityType enum values
export const NodeEntityTypeSchema = z.nativeEnum(NodeEntityType);
