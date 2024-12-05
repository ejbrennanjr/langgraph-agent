/**
 * @fileoverview Default Import Mapper
 * Maps default imports from modules to domain nodes and edges.
 * Creates appropriate module-level and entity-level relationships between
 * source modules, referenced modules, and their entities.
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
  ExternalImportEntityData,
  createExternalImportEntityNode,
} from "@/libs/typescript-graph/domain/ExternalImportEntityNode";
import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";
import { getFactoryForEntity } from "@/libs/typescript-graph/mappers/utils/getFactoryForEntity";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";
import {
  ModuleDataSchema,
  createDefaultImport,
} from "@/libs/typescript-graph/domain/ModuleNode";

// ==========================================================================================================================
// EXPORTED FUNCTIONS
// ==========================================================================================================================

/**
 * Maps a default import declaration to domain nodes and edges.
 * Creates entity nodes and establishes relationships between:
 * - Source module and imported entity (ModuleImportsDefault)
 * - Referenced module and exported entity (ModuleExportsNamed)
 *
 * Path Handling Strategy:
 * - Node IDs use full filesystem paths (referencedModulePath)
 * - Import metadata uses original module specifier from source (relative path or package name)
 *
 * @param sourceModuleId - The ID of the importing module
 * @param referencedModuleId - The ID of the module being imported from
 * @param referencedModulePath - Full path to referenced module (for node ID generation)
 * @param importDecl - The import declaration to process
 * @param isExternal - Indicates if the import is from an external module
 * @returns MappingResult containing:
 *   - nodes: The imported entity node
 *   - edges: ModuleImportsDefault and ModuleExportsNamed relationships
 *   - data: ModuleNode data with default import information using original specifier
 */
export function mapDefaultImport(
  sourceModuleId: string,
  referencedModuleId: string,
  referencedModulePath: string,
  importDecl: ImportDeclaration,
  isExternal: boolean
): MappingResult<typeof ModuleDataSchema> {
  const defaultImport = importDecl.getDefaultImport();
  if (!defaultImport) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: {
        named: [],
        namespaces: [],
        defaults: [],
      },
    });
  }

  // Extract the original module specifier as it appears in the import declaration
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

  return isExternal
    ? mapExternalDefaultImport(
        sourceModuleId,
        referencedModuleId,
        originalModuleSpecifier, // Use package name throughout for external modules
        defaultImport
      )
    : mapInternalDefaultImport(
        sourceModuleId,
        referencedModuleId,
        referencedModulePath, // Use full path for node IDs
        originalModuleSpecifier, // Use original relative path for metadata
        defaultImport
      );
}

// ==========================================================================================================================
// INTERNAL HELPERS
// ==========================================================================================================================

/**
 * Maps an external default import by creating a placeholder node.
 * Creates an ExternalImportEntity node representation and the corresponding
 * import/export relationships.
 *
 * For external modules:
 * - Uses package name consistently for both node IDs and metadata
 *
 * @param sourceModuleId - The ID of the importing module
 * @param referencedModuleId - The ID of the module being imported from
 * @param moduleSpecifier - Package name of the external module
 * @param defaultImport - The default import identifier to map
 * @returns MappingResult containing the node and relationships
 */
function mapExternalDefaultImport(
  sourceModuleId: string,
  referencedModuleId: string,
  moduleSpecifier: string,
  defaultImport: Identifier
): MappingResult<typeof ModuleDataSchema> {
  const entityName = defaultImport.getText();

  // Generate node ID using package name
  const referencedEntityId = generateNodeId(
    moduleSpecifier,
    TypeScriptNodeTypes.ExternalImportEntity,
    entityName
  );

  const entityData: ExternalImportEntityData = {
    entityType: TypeScriptNodeTypes.ExternalImportEntity,
  };

  // Create placeholder node for the imported entity using the generated ID
  const node = createExternalImportEntityNode(
    referencedEntityId,
    entityName,
    TypeScriptExportValues.External,
    TypeScriptNodeStatus.Resolved,
    createEmptySourceLocation(),
    entityData
  );

  // Create edges for both import and export relationships
  const edges = [
    // Source module imports the entity
    createTypeScriptEdge(
      generateEdgeId(
        sourceModuleId,
        TypeScriptEdgeRelationshipValues.ModuleImportsDefault,
        referencedEntityId
      ),
      sourceModuleId,
      referencedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleImportsDefault
    ),
    // Referenced module exports the entity
    createTypeScriptEdge(
      generateEdgeId(
        referencedModuleId,
        TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
        referencedEntityId
      ),
      referencedModuleId,
      referencedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleExportsNamed
    ),
  ];

  return createMappingResult(ModuleDataSchema, [node], edges, {
    imports: {
      named: [],
      namespaces: [],
      defaults: [createDefaultImport(moduleSpecifier)], // Use package name in metadata
    },
  });
}

/**
 * Maps an internal default import by resolving the entity it refers to.
 * This function:
 * 1. Resolves the actual entity declaration using TypeScript's symbol resolution
 * 2. Determines the appropriate TypeScript node type
 * 3. Creates the corresponding node with proper ID using full path
 * 4. Creates both import and export relationships
 * 5. Maintains original relative path in metadata
 *
 * @param sourceModuleId - The ID of the importing module
 * @param referencedModuleId - The ID of the module being imported from
 * @param referencedModulePath - Full path for node ID generation
 * @param originalModuleSpecifier - Original relative path from import statement
 * @param defaultImport - The default import identifier to map
 * @returns MappingResult containing the node and relationships
 */
function mapInternalDefaultImport(
  sourceModuleId: string,
  referencedModuleId: string,
  referencedModulePath: string,
  originalModuleSpecifier: string,
  defaultImport: Identifier
): MappingResult<typeof ModuleDataSchema> {
  // First get the symbol from the import identifier
  const importSymbol = defaultImport.getSymbol();
  if (!importSymbol) {
    console.warn(
      `Warning: Could not resolve symbol for default import: ${defaultImport.getText()}`
    );
    return createMappingResult(ModuleDataSchema, [], [], {
      path: originalModuleSpecifier,
      imports: { named: [], namespaces: [], defaults: [] },
      exports: { named: [], reExports: [], wildcards: [] },
    });
  }

  const aliasedSymbol = importSymbol.getAliasedSymbol();
  if (!aliasedSymbol) {
    console.warn(
      `Warning: Could not resolve aliased symbol for default import: ${defaultImport.getText()}`
    );
    return createMappingResult(ModuleDataSchema, [], [], {
      path: originalModuleSpecifier,
      imports: { named: [], namespaces: [], defaults: [] },
      exports: { named: [], reExports: [], wildcards: [] },
    });
  }

  const declarationNode = aliasedSymbol.getDeclarations()?.[0];
  if (!declarationNode) {
    console.warn(
      `Warning: Could not resolve the declaration for default import: ${defaultImport.getText()}`
    );
    return createMappingResult(ModuleDataSchema, [], [], {
      path: originalModuleSpecifier,
      imports: { named: [], namespaces: [], defaults: [] },
      exports: { named: [], reExports: [], wildcards: [] },
    });
  }

  const entityType = getEntityType(declarationNode);
  const entityName = defaultImport.getText();

  // Generate node ID using full path
  const referencedEntityId = generateNodeId(
    referencedModulePath,
    entityType,
    entityName
  );

  const factoryFn = getFactoryForEntity(entityType);

  const node = factoryFn(
    referencedEntityId,
    entityName,
    TypeScriptExportValues.Internal,
    TypeScriptNodeStatus.Placeholder,
    createEmptySourceLocation(),
    {}
  );

  const edges = [
    createTypeScriptEdge(
      generateEdgeId(
        sourceModuleId,
        TypeScriptEdgeRelationshipValues.ModuleImportsDefault,
        referencedEntityId
      ),
      sourceModuleId,
      referencedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleImportsDefault
    ),
    createTypeScriptEdge(
      generateEdgeId(
        referencedModuleId,
        TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
        referencedEntityId
      ),
      referencedModuleId,
      referencedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleExportsNamed
    ),
  ];

  return createMappingResult(ModuleDataSchema, [node], edges, {
    path: originalModuleSpecifier, // Use original relative path
    imports: {
      named: [],
      namespaces: [],
      defaults: [createDefaultImport(originalModuleSpecifier)], // Use original relative path
    },
    exports: {
      named: [],
      reExports: [],
      wildcards: [],
    },
  });
}
