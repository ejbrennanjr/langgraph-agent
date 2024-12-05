/**
 * @fileoverview Module mapper functionality
 * Maps a TypeScript source file to a ModuleNode representation and its related entities.
 *
 * Path Handling Strategy:
 * - Node IDs use full filesystem paths via generateNodeId
 * - Edge source/target use full paths
 * - Import/Export metadata maintains relative paths as they appear in source
 */

import { SourceFile } from "ts-morph";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import {
  ModuleDataSchema,
  createModuleNode,
} from "@/libs/typescript-graph/domain/ModuleNode";

import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";

import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";

import { determineModuleKind } from "@/libs/typescript-graph/mappers/usecases/module/utils/determineModuleKind";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";
import { mapModuleExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/mapModuleExports";
import { mapModuleImports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/imports/mapModuleImports";

/**
 * Maps a TypeScript source file to a complete ModuleNode representation.
 * Uses consistent path handling throughout the mapping process.
 *
 * Path Handling:
 * - Uses full filesystem paths for node IDs and file references
 * - Maintains relative paths in import/export metadata
 * - Delegates path handling for imports/exports to specialized mappers
 *
 * Module Structure:
 * - Maps all imports (named, default, namespace)
 * - Maps all exports (named, default, re-exports, wildcards)
 * - Creates relationships between module and its entities
 * - Maintains proper path handling throughout
 *
 * @param sourceFile - The ts-morph SourceFile to analyze
 * @returns MappingResult containing:
 *   - nodes: All discovered nodes including the module and its entities
 *   - edges: All relationships between nodes
 *   - data: Complete module data with imports and exports
 *
 * @example
 * ```typescript
 * // For source file:
 * // import { User } from './types';
 * // export class UserService { ... }
 *
 * const result = mapModule(sourceFile);
 * // Returns:
 * // - ModuleNode for the source file
 * // - Nodes for User and UserService
 * // - Import and export relationships
 * // - Complete module data structure
 * ```
 */
export function mapModule(
  sourceFile: SourceFile
): MappingResult<typeof ModuleDataSchema> {
  // Extract core file information
  const filePath = sourceFile.getFilePath();
  const moduleName = sourceFile.getBaseNameWithoutExtension();

  // Generate module ID using full path
  const sourceModuleId = generateNodeId(
    filePath,
    TypeScriptNodeTypes.Module,
    moduleName
  );

  // Map imports and exports using specialized mappers
  // These mappers handle path transformations internally
  const importResults = mapModuleImports(sourceFile, sourceModuleId);
  const exportResults = mapModuleExports(sourceFile, sourceModuleId);

  // Combine results maintaining proper path handling
  const combinedResults = combineMappingResults(ModuleDataSchema, [
    importResults,
    exportResults,
  ]);

  // Validate combined results
  if (!combinedResults.data?.imports || !combinedResults.data?.exports) {
    console.warn(
      `Incomplete data from combinedResults for module: ${moduleName}`
    );
  }

  // Create the module node with complete data
  const moduleNode = createModuleNode(
    sourceModuleId,
    moduleName,
    TypeScriptExportValues.Internal,
    TypeScriptNodeStatus.Resolved,
    createEmptySourceLocation(),
    {
      path: filePath, // Use full path in module data
      moduleKind: determineModuleKind(sourceFile),
      // Maintain import/export data structure with proper paths
      imports: combinedResults.data?.imports ?? {
        named: [],
        namespaces: [],
        defaults: [],
      },
      exports: combinedResults.data?.exports ?? {
        named: [],
        reExports: [],
        wildcards: [],
        default: undefined,
      },
    }
  );

  // Return complete result with all nodes, edges, and data
  return createMappingResult(
    ModuleDataSchema,
    [moduleNode, ...combinedResults.nodes], // Include module node and all discovered entities
    combinedResults.edges, // All relationships between nodes
    moduleNode.data // Complete module data structure
  );
}
