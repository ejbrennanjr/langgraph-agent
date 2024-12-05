/**
 * @fileoverview Namespace Import Mapper
 * Maps namespace imports to domain nodes and edges.
 * Creates module-level relationships between source modules and
 * their namespace imports, which act as containers for accessing
 * the referenced module's exports.
 */

import { Identifier, ImportDeclaration } from "ts-morph";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  createTypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";
import {
  ModuleDataSchema,
  createNamespaceImport,
} from "@/libs/typescript-graph/domain/ModuleNode";
import {
  NamespaceImportData,
  createNamespaceImportNode,
} from "@/libs/typescript-graph/domain/NamespaceImportNode";

// ==========================================================================================================================
// EXPORTED FUNCTIONS
// ==========================================================================================================================

/**
 * Maps namespace import declarations to domain nodes and edges.
 * Creates entity nodes and establishes relationships for namespace imports,
 * which provide a container-based way to access a module's exports.
 *
 * @param sourceModuleId - The ID of the importing module
 * @param referencedModuleId - The ID of the module being imported from
 * @param referencedModuleSpecifier - The module specifier (path or name) of the referenced module
 * @param importDecl - The import declaration to process
 * @param isExternal - Indicates if the import is from an external module
 * @returns MappingResult containing:
 *   - nodes: The namespace import node
 *   - edges: ModuleImportsNamespace relationship
 *   - data: ModuleNode data with namespace import information
 *
 * @example
 * ```typescript
 * // For: import * as path from 'path'
 * const result = mapNamespaceImport(
 *   '/src/user.ts::module::user',          // sourceModuleId
 *   'path::module::path',                  // referencedModuleId
 *   'path',                                // referencedModuleSpecifier
 *   importDecl,
 *   true
 * );
 * ```
 */
/**
 * Maps namespace import declarations to domain nodes and edges.
 * Creates entity nodes and establishes relationships for namespace imports,
 * which provide a container-based way to access a module's exports.
 */
export function mapNamespaceImport(
  sourceModuleId: string,
  referencedModuleId: string,
  referencedModulePath: string,
  importDecl: ImportDeclaration,
  isExternal: boolean
): MappingResult<typeof ModuleDataSchema> {
  const namespaceImport = importDecl.getNamespaceImport();
  if (!namespaceImport) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: {
        named: [],
        namespaces: [],
        defaults: [],
      },
    });
  }

  const entityName = namespaceImport.getText();

  // Get the original module specifier as it appears in the import declaration
  const originalModuleSpecifier = importDecl.getModuleSpecifierValue();
  if (!originalModuleSpecifier) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: {
        named: [],
        namespaces: [],
        defaults: [],
      },
    });
  }

  // Generate proper node ID using the full path
  const referencedEntityId = generateNodeId(
    referencedModulePath,
    TypeScriptNodeTypes.NamespaceImport,
    entityName
  );

  // Create namespace import node
  const entityData: NamespaceImportData = {
    namespaceName: entityName,
  };

  const node = createNamespaceImportNode(
    referencedEntityId,
    entityName,
    isExternal
      ? TypeScriptExportValues.External
      : TypeScriptExportValues.Internal,
    isExternal
      ? TypeScriptNodeStatus.Resolved
      : TypeScriptNodeStatus.Placeholder,
    createEmptySourceLocation(),
    entityData
  );

  // Create edge for namespace import relationship
  const edge = createTypeScriptEdge(
    generateEdgeId(
      sourceModuleId,
      TypeScriptEdgeRelationshipValues.ModuleImportsNamespace,
      referencedEntityId
    ),
    sourceModuleId,
    referencedEntityId,
    TypeScriptEdgeRelationshipValues.ModuleImportsNamespace
  );

  return createMappingResult(ModuleDataSchema, [node], [edge], {
    imports: {
      named: [],
      namespaces: [createNamespaceImport(originalModuleSpecifier, entityName)],
      defaults: [],
    },
  });
}
