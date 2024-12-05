/**
 * @fileoverview Module Imports Mapper
 *
 * This mapper processes TypeScript module import declarations and creates corresponding nodes and edges
 * in the module dependency graph. It handles:
 * - Named imports: import { X, Y } from 'module'
 * - Default imports: import X from 'module'
 * - Namespace imports: import * as X from 'module'
 * - Mixed imports: import X, { Y, Z } from 'module'
 * - External vs internal module imports
 *
 * The mapper is responsible for:
 * 1. Validating import declarations
 * 2. Creating module nodes for referenced modules
 * 3. Delegating to specialized mappers for different import types
 * 4. Establishing and tracking module dependencies
 * 5. Handling error cases gracefully
 */

import { SourceFile } from "ts-morph";
import { getModuleCategory } from "@/libs/typescript-files/usecases/getModuleCategory";
import { ModuleCategory } from "@/libs/typescript-files/domain/ModuleCategory";

import {
  createTypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";
import {
  ModuleDataSchema,
  createModuleNode,
} from "@/libs/typescript-graph/domain/ModuleNode";
import { createExternalModuleNode } from "@/libs/typescript-graph/domain/ExternalModuleNode";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";

import { mapDefaultImport } from "./usecases/mapDefaultImport";
import { mapNamedImports } from "./usecases/mapNamedImports";
import { mapNamespaceImport } from "./usecases/mapNamespaceImport";

/**
 * Maps all imports in a TypeScript module to domain nodes and edges.
 *
 * @param sourceFile - The TypeScript source file being analyzed
 * @param sourceModuleId - The unique identifier of the source module
 *
 * @returns MappingResult containing:
 *   nodes: Array including
 *     - Referenced module nodes (internal or external)
 *     - Imported entity nodes (from specialized mappers)
 *   edges: Array including
 *     - ModuleDependsOn edges between source and referenced modules (deduplicated)
 *     - Import/export relationship edges from specialized mappers
 *   data: Combined import metadata including all import types
 */
export function mapModuleImports(
  sourceFile: SourceFile,
  sourceModuleId: string
): MappingResult<typeof ModuleDataSchema> {
  // Early return if no imports to process
  const importDeclarations = sourceFile.getImportDeclarations();
  if (!importDeclarations.length) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: {
        named: [],
        namespaces: [],
        defaults: [],
      },
    });
  }

  // Track modules we've already created dependency edges for to avoid duplicates
  const processedModuleDependencies = new Set<string>();

  // Process each import declaration separately and combine results
  const importResults = importDeclarations.map((importDecl) => {
    try {
      // Validate that this is a proper import declaration with at least one import
      const isValidImport =
        importDecl.getDefaultImport() || // Has default import
        importDecl.getNamespaceImport() || // Has namespace import
        importDecl.getNamedImports().length > 0; // Has named imports

      // Skip processing if the import is invalid
      if (!isValidImport) {
        return createMappingResult(ModuleDataSchema, [], [], {
          imports: {
            named: [],
            namespaces: [],
            defaults: [],
          },
        });
      }

      // Get and validate the module specifier
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) {
        return createMappingResult(ModuleDataSchema, [], [], {
          imports: {
            named: [],
            namespaces: [],
            defaults: [],
          },
        });
      }
      // Resolve the full path for the module specifier
      const referencedSourceFile = importDecl.getModuleSpecifierSourceFile();
      const resolvedModulePath = referencedSourceFile
        ? referencedSourceFile.getFilePath() // Absolute path for internal modules
        : moduleSpecifier; // Use the original specifier for external modules

      // Determine if this is an external module import
      const isExternal =
        getModuleCategory(resolvedModulePath) === ModuleCategory.External;

      // Extract module name from path or use full specifier for core modules
      const moduleName = moduleSpecifier.split("/").pop() ?? moduleSpecifier;

      // Generate unique identifier for the referenced module
      const referencedModuleId = generateNodeId(
        resolvedModulePath,
        isExternal
          ? TypeScriptNodeTypes.ExternalModule
          : TypeScriptNodeTypes.Module,
        moduleName
      );

      // Create appropriate module node based on whether it's external or internal
      const referencedModuleNode = isExternal
        ? createExternalModuleNode(
            referencedModuleId,
            moduleName,
            TypeScriptExportValues.External,
            TypeScriptNodeStatus.Resolved,
            createEmptySourceLocation(),
            {}
          )
        : createModuleNode(
            referencedModuleId,
            moduleName,
            TypeScriptExportValues.Internal,
            TypeScriptNodeStatus.Placeholder,
            createEmptySourceLocation(),
            { path: moduleSpecifier }
          );

      // Process all import types using their specialized mappers
      const results = [
        mapNamedImports(
          sourceModuleId,
          referencedModuleId,
          resolvedModulePath,
          importDecl,
          isExternal
        ),
        mapDefaultImport(
          sourceModuleId,
          referencedModuleId,
          resolvedModulePath,
          importDecl,
          isExternal
        ),
        mapNamespaceImport(
          sourceModuleId,
          referencedModuleId,
          resolvedModulePath,
          importDecl,
          isExternal
        ),
      ];

      // Create module dependency edge if we haven't processed this module yet
      const edges = [];
      if (!processedModuleDependencies.has(referencedModuleId)) {
        edges.push(
          createTypeScriptEdge(
            generateEdgeId(
              sourceModuleId,
              TypeScriptEdgeRelationshipValues.ModuleDependsOn,
              referencedModuleId
            ),
            sourceModuleId,
            referencedModuleId,
            TypeScriptEdgeRelationshipValues.ModuleDependsOn
          )
        );
        processedModuleDependencies.add(referencedModuleId);
      }

      // Combine all mapper results with module-level elements
      const combined = combineMappingResults(ModuleDataSchema, results);
      return {
        ...combined,
        nodes: [...combined.nodes, referencedModuleNode], // Include both entity and module nodes
        edges: [...combined.edges, ...edges], // Include both entity and module edges
      };
    } catch (error) {
      // If anything fails during import processing, return empty result
      // This ensures we fail gracefully and don't break the entire analysis
      return createMappingResult(ModuleDataSchema, [], [], {
        imports: {
          named: [],
          namespaces: [],
          defaults: [],
        },
      });
    }
  });

  // Combine results from all import declarations into final result
  return combineMappingResults(ModuleDataSchema, importResults);
}
