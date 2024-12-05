import {
  Node,
  FunctionDeclaration,
  ClassDeclaration,
  VariableDeclaration,
  EnumDeclaration,
} from "ts-morph";

import { NodeEntityType } from "../enums";
import { BaseNode, BaseEdge } from "../types";

/**
 * Type guard function to check if an object conforms to the BaseNode type.
 *
 * @param data - The object to check.
 * @returns A boolean indicating whether the object is of type BaseNode.
 */
export function isBaseNode(data: any): data is BaseNode {
  return data && typeof data.type === "string" && typeof data.name === "string";
}

/**
 * Type guard function to check if an object conforms to the BaseEdge type.
 *
 * @param data - The object to check.
 * @returns A boolean indicating whether the object is of type BaseEdge.
 */
export function isBaseEdge(data: any): data is BaseEdge {
  return data && typeof data.type === "string";
}

/**
 * Checks if a node is a FunctionDeclaration and is exportable.
 * @param declaration - The node to check.
 * @returns A boolean indicating if the node is a FunctionDeclaration.
 */
export function isExportableFunction(
  declaration: Node
): declaration is FunctionDeclaration {
  return declaration instanceof FunctionDeclaration;
}

/**
 * Checks if a node is a ClassDeclaration and is exportable.
 * @param declaration - The node to check.
 * @returns A boolean indicating if the node is a ClassDeclaration.
 */
export function isExportableClass(
  declaration: Node
): declaration is ClassDeclaration {
  return declaration instanceof ClassDeclaration;
}

/**
 * Checks if a node is a VariableDeclaration and is exportable.
 * @param declaration - The node to check.
 * @returns A boolean indicating if the node is a VariableDeclaration.
 */
export function isExportableVariable(
  declaration: Node
): declaration is VariableDeclaration {
  return declaration instanceof VariableDeclaration;
}

/**
 * Checks if a node is an EnumDeclaration and is exportable.
 * @param declaration - The node to check.
 * @returns A boolean indicating if the node is an EnumDeclaration.
 */
export function isExportableEnum(
  declaration: Node
): declaration is EnumDeclaration {
  return declaration instanceof EnumDeclaration;
}

/**
 * Type guard to check if a given value is a valid NodeType.
 *
 * This function verifies that the provided `type` is one of the values defined in the
 * NodeType enum, ensuring that it matches an expected node type.
 *
 * Type guards are useful in TypeScript for narrowing down types, allowing the compiler
 * to infer more specific types within conditional blocks, like switch statements.
 *
 * @param type - The value to check against the NodeType enum.
 * @returns True if the type is a valid NodeType, otherwise false.
 */
export function isValidNodeType(type: any): type is NodeEntityType {
  // Object.values(NodeType) returns an array of all valid NodeType values.
  // The function then checks if the provided type is included in this array.
  return Object.values(NodeEntityType).includes(type);
}
