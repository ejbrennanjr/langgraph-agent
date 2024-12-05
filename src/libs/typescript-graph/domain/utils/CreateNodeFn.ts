/**
 * @fileoverview Defines the base factory function type for creating TypeScript graph nodes.
 *
 * This module provides the CreateNodeFn type which serves as a template for all node
 * factory functions in the TypeScript graph. It separates common node fields from
 * node-specific entity data to provide a consistent creation pattern across all node types.
 */

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  SourceLocation,
  TypeScriptNodeStatus,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * Factory function type for creating TypeScript graph nodes.
 *
 * This type provides a consistent interface for node creation across different node types.
 * It separates the common fields that all nodes share from the entity-specific data
 * that varies by node type.
 *
 * Type Parameters:
 * @template T - The specific node type being created (e.g., DecoratorNode, PropertyNode)
 * @template EntityData - The type containing all node-specific data required for creation
 *
 * Common Parameters:
 * @param id - Unique identifier for the node
 * @param name - Name of the node element (e.g., class name, interface name)
 * @param scope - Export scope/visibility of the node
 * @param status - Current resolution status of the node
 * @param location - Source code location information
 * @param entityData - All data specific to this type of node
 *
 * @returns A fully constructed and validated node of type T
 *
 * @example Node with required target field (Decorator)
 * ```typescript
 * type DecoratorEntityData = {
 *   target: DecoratorTargetValues;  // Required
 *   arguments?: DecoratorArgument[];  // Optional
 * };
 *
 * const createDecorator: CreateNodeFn<DecoratorNode, DecoratorEntityData> = (
 *   id,
 *   name,
 *   scope,
 *   status,
 *   location,
 *   entityData
 * ) => { ... }
 * ```
 *
 * @example Node with all optional fields (Interface)
 * ```typescript
 * type InterfaceEntityData = {
 *   generics?: GenericParameter[];
 *   extends?: TypeReference[];
 *   memberNames?: MemberNames;
 * };
 *
 * const createInterface: CreateNodeFn<InterfaceNode, InterfaceEntityData> = (
 *   id,
 *   name,
 *   scope,
 *   status,
 *   location,
 *   entityData
 * ) => { ... }
 * ```
 */
export type CreateNodeFn<T, EntityData> = (
  id: string,
  name: string,
  scope: TypeScriptExportValues,
  status: TypeScriptNodeStatus,
  location: SourceLocation,
  entityData: Partial<EntityData> // Allow partial entity data to rely on schema defaults
) => T;
