import { ExportDeclaration, ExportSpecifier, SourceFile } from "ts-morph";

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
import {
  createModuleNode,
  createReExport,
  ModuleDataSchema,
} from "@/libs/typescript-graph/domain/ModuleNode";
import { createWildcardExportNode } from "@/libs/typescript-graph/domain/WildcardExportNode";

import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";
import { getFactoryForEntity } from "@/libs/typescript-graph/mappers/utils/getFactoryForEntity";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";

// ==========================================================================================================================
// EXPORTED FUNCTIONS
// ==========================================================================================================================

/**
 * Maps re-export declarations to domain nodes and edges.
 * Delegates to specific functions for handling wildcard and named re-exports.
 *
 * Updates:
 * - `sourceFile` is added as a parameter to use its file path for entity ID generation.
 * - The `generateNodeId` call now uses `sourceFile.getFilePath()` instead of `sourceModuleId`.
 *
 * @param sourceFile - The TypeScript source file being processed.
 * @param sourceModuleId - The unique identifier of the source module.
 * @param exportDecl - The export declaration to process.
 * @returns MappingResult containing nodes, edges, and export data.
 *
 * @example
 * ```typescript
 * // For export { X, Y as Z } from './module'
 * const result = mapReExports(sourceFile, moduleId, exportDecl);
 * ```
 */
export function mapReExports(
  sourceFile: SourceFile,
  sourceModuleId: string,
  exportDecl: ExportDeclaration
): MappingResult<typeof ModuleDataSchema> {
  // Retrieve the module path specified in the export statement (e.g., './Y' in `export * from './Y'`)
  const moduleSpecifier = exportDecl
    .getModuleSpecifier()
    ?.getText()
    .replace(/^['"]|['"]$/g, "");
  if (!moduleSpecifier) {
    // Return an empty MappingResult if no module specifier is found
    return createMappingResult(ModuleDataSchema, [], [], {
      exports: {
        named: [],
        reExports: [],
        wildcards: [],
        default: undefined,
      },
    });
  }

  // Check if the re-export is named or wildcard
  const namedExports = exportDecl.getNamedExports();
  return namedExports.length
    ? mapNamedReExports(
        sourceFile,
        sourceModuleId,
        namedExports,
        moduleSpecifier
      )
    : mapWildcardReExport(sourceFile, sourceModuleId, moduleSpecifier);
}

// ==========================================================================================================================
// INTERNAL HELPERS
// ==========================================================================================================================

/**
 * Handles named and aliased re-exports (e.g., `export { X as Y } from './module'`).
 *
 * Updates:
 * - `sourceFile` is added as a parameter to use its file path for entity ID generation.
 * - The `generateNodeId` call now uses `sourceFile.getFilePath()` instead of `sourceModuleId`.
 *
 * @param sourceFile - The TypeScript source file being processed.
 * @param sourceModuleId - The unique identifier of the source module.
 * @param namedExports - The list of named exports from the export declaration.
 * @param moduleSpecifier - The path of the module being re-exported.
 * @returns MappingResult containing nodes, edges, and data for each re-exported entity.
 *
 * @example
 * ```typescript
 * // For export { UserService as AdminService } from './user';
 * const result = mapNamedReExports(sourceFile, moduleId, namedExports, './user');
 * ```
 */
export function mapNamedReExports(
  sourceFile: SourceFile,
  sourceModuleId: string,
  namedExports: readonly ExportSpecifier[],
  moduleSpecifier: string
): MappingResult<typeof ModuleDataSchema> {
  const result = namedExports.map((namedExport) => {
    const localName = namedExport.getName(); // Local name in the module
    const alias = namedExport.getAliasNode()?.getText() ?? undefined; // Optional alias
    const exportedName = alias || localName;

    // Retrieve the declaration node of the re-exported entity
    const symbol = namedExport.getSymbol();
    const aliasedSymbol = symbol?.getAliasedSymbol() ?? symbol; // Resolve alias if it exists
    const declarationNode = aliasedSymbol?.getDeclarations()?.[0];

    if (!declarationNode) {
      console.warn(
        `Warning: Could not resolve the declaration of re-exported entity: ${localName}`
      );
      return createMappingResult(ModuleDataSchema, [], [], {
        exports: {
          named: [],
          reExports: [],
          wildcards: [],
        },
      });
    }

    // Determine entity type and retrieve the appropriate factory function
    const entityType = getEntityType(declarationNode);
    const factoryFn = getFactoryForEntity(entityType);

    // Generate a unique identifier for the exported entity
    const exportedEntityId = generateNodeId(
      sourceFile.getFilePath(),
      entityType,
      exportedName
    );

    // Create the export node and relationship edge
    const exportNode = factoryFn(
      exportedEntityId,
      exportedName,
      TypeScriptExportValues.Internal,
      TypeScriptNodeStatus.Placeholder,
      createEmptySourceLocation(),
      {}
    );

    const exportEdge = createTypeScriptEdge(
      generateEdgeId(
        sourceModuleId,
        TypeScriptEdgeRelationshipValues.ModuleReExports,
        exportedEntityId
      ),
      sourceModuleId,
      exportedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleReExports
    );

    // Wrap the result for this re-export
    return createMappingResult(ModuleDataSchema, [exportNode], [exportEdge], {
      exports: {
        named: [],
        reExports: [createReExport(moduleSpecifier, localName, alias)],
        wildcards: [],
      },
    });
  });

  // Combine all individual MappingResults into a single MappingResult
  return combineMappingResults(ModuleDataSchema, result);
}

/**
 * Handles wildcard re-exports (e.g., `export * from './module'`).
 *
 * Updates:
 * - `sourceFile` is added as a parameter to use its file path for entity ID generation.
 * - The `generateNodeId` call now uses `sourceFile.getFilePath()` instead of `sourceModuleId`.
 *
 * @param sourceFile - The TypeScript source file being processed.
 * @param sourceModuleId - The unique identifier of the source module.
 * @param moduleSpecifier - The path of the module being re-exported.
 * @returns MappingResult containing the wildcard re-export node and relationship.
 *
 * @example
 * ```typescript
 * // For export * from './user';
 * const result = mapWildcardReExport(sourceFile, moduleId, './user');
 * ```
 */
export function mapWildcardReExport(
  sourceFile: SourceFile,
  sourceModuleId: string,
  moduleSpecifier: string
): MappingResult<typeof ModuleDataSchema> {
  if (!moduleSpecifier) {
    console.warn(
      `Warning: Wildcard re-export missing module specifier in module ${sourceModuleId}`
    );
    return createMappingResult(ModuleDataSchema, [], [], {
      exports: {
        named: [],
        reExports: [],
        wildcards: [],
      },
    });
  }

  // Extract module name from path or use full specifier for core modules
  const moduleName = moduleSpecifier.split("/").pop() ?? moduleSpecifier;

  // Generate a unique identifier for the wildcard export
  const wildcardModuleId = generateNodeId(
    sourceFile.getFilePath(),
    TypeScriptNodeTypes.WildcardExport,
    moduleName
  );

  // Create a wildcard export node with the module specifier
  const wildcardExportNode = createWildcardExportNode(
    wildcardModuleId,
    moduleSpecifier,
    TypeScriptExportValues.Internal,
    TypeScriptNodeStatus.Placeholder,
    createEmptySourceLocation(),
    {
      sourceModulePath: moduleSpecifier,
    }
  );

  // Create an edge to represent the wildcard re-export relationship
  const exportEdge = createTypeScriptEdge(
    generateEdgeId(
      sourceModuleId,
      TypeScriptEdgeRelationshipValues.ModuleReExports,
      wildcardModuleId
    ),
    sourceModuleId,
    wildcardModuleId,
    TypeScriptEdgeRelationshipValues.ModuleReExports
  );

  // Return a MappingResult for the wildcard re-export
  return createMappingResult(
    ModuleDataSchema,
    [wildcardExportNode],
    [exportEdge],
    {
      exports: {
        named: [],
        reExports: [],
        wildcards: [moduleSpecifier],
      },
    }
  );
}
