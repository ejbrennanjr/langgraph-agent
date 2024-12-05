/**
 * @fileoverview Named Imports Mapper
 * Maps named imports to domain nodes and edges.
 * Creates appropriate module-level and entity-level relationships between
 * source modules, referenced modules, and their entities.
 */
import { z } from "zod";
import { ImportDeclaration, ImportSpecifier } from "ts-morph";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  createTypeScriptEdge,
  TypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";
import {
  TypeScriptNode,
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
  createNamedImport,
} from "@/libs/typescript-graph/domain/ModuleNode";

/**
 * Maps named import declarations to domain nodes and edges.
 *
 * Path Handling Strategy:
 * - referencedModulePath: Full filesystem path used for node ID generation
 * - Module specifier: Original relative path or package name from import statement, used in metadata
 *
 * @param sourceModuleId - The ID of the importing module
 * @param referencedModuleId - The ID of the module being imported from
 * @param referencedModulePath - Full path to referenced module (for node ID generation)
 * @param importDecl - The import declaration to process
 * @param isExternal - Indicates if the import is from an external module
 * @returns MappingResult containing nodes, edges, and import metadata
 */
export function mapNamedImports(
  sourceModuleId: string,
  referencedModuleId: string,
  referencedModulePath: string,
  importDecl: ImportDeclaration,
  isExternal: boolean
): MappingResult<typeof ModuleDataSchema> {
  const namedImports = importDecl.getNamedImports();
  if (!namedImports.length) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: { named: [], namespaces: [], defaults: [] },
    });
  }

  // Extract the original module specifier from the import declaration
  // This preserves the relative path or package name as written in the source
  const originalModuleSpecifier = importDecl.getModuleSpecifierValue();
  if (!originalModuleSpecifier) {
    return createMappingResult(ModuleDataSchema, [], [], {
      imports: { named: [], namespaces: [], defaults: [] },
    });
  }

  return isExternal
    ? mapExternalNamedImports(
        sourceModuleId,
        referencedModuleId,
        originalModuleSpecifier, // For external modules, use package name throughout
        namedImports
      )
    : mapInternalNamedImports(
        sourceModuleId,
        referencedModuleId,
        referencedModulePath, // Full path for node ID generation
        originalModuleSpecifier, // Original relative path for metadata
        namedImports
      );
}

/**
 * Maps internal named imports by resolving the entities they refer to.
 * Uses full paths for node IDs but preserves relative paths in metadata.
 *
 * @param sourceModuleId - ID of importing module
 * @param referencedModuleId - ID of module being imported from
 * @param referencedModulePath - Full path for node ID generation
 * @param originalModuleSpecifier - Original relative path from import statement
 * @param namedImports - Array of named import specifiers to map
 */
function mapInternalNamedImports(
  sourceModuleId: string,
  referencedModuleId: string,
  referencedModulePath: string,
  originalModuleSpecifier: string,
  namedImports: ImportSpecifier[]
): MappingResult<typeof ModuleDataSchema> {
  const { nodes, edges, named } = namedImports.reduce(
    (acc, importSpecifier) => {
      const importName = importSpecifier.getName();
      const importSymbol = importSpecifier.getSymbol();

      if (!importSymbol) {
        console.warn(
          `Warning: Could not resolve symbol for named import: ${importName}`
        );
        return acc;
      }

      const aliasedSymbol = importSymbol.getAliasedSymbol() || importSymbol;
      const declarationNode = aliasedSymbol.getDeclarations()?.[0];

      if (!declarationNode) {
        console.warn(
          `Warning: Could not resolve declaration for named import: ${importName}`
        );
        return acc;
      }

      const entityType = getEntityType(declarationNode);

      // Generate node ID using full path
      const referencedEntityId = generateNodeId(
        referencedModulePath,
        entityType,
        importName
      );

      const factoryFn = getFactoryForEntity(entityType);

      const node = factoryFn(
        referencedEntityId,
        importName,
        TypeScriptExportValues.Internal,
        TypeScriptNodeStatus.Placeholder,
        createEmptySourceLocation(),
        {}
      );

      acc.nodes.push(node);

      acc.edges.push(
        createTypeScriptEdge(
          generateEdgeId(
            sourceModuleId,
            TypeScriptEdgeRelationshipValues.ModuleImportsNamed,
            referencedEntityId
          ),
          sourceModuleId,
          referencedEntityId,
          TypeScriptEdgeRelationshipValues.ModuleImportsNamed
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
        )
      );

      // Use original module specifier in import metadata
      acc.named.push(
        createNamedImport(
          originalModuleSpecifier,
          importSpecifier.getName(),
          importSpecifier.getAliasNode()?.getText() ?? null
        )
      );

      return acc;
    },
    {
      nodes: [] as TypeScriptNode<z.ZodTypeAny>[],
      edges: [] as TypeScriptEdge[],
      named: [] as ReturnType<typeof createNamedImport>[],
    }
  );

  return createMappingResult(ModuleDataSchema, nodes, edges, {
    imports: {
      named,
      namespaces: [],
      defaults: [],
    },
  });
}

/**
 * Maps external named imports by creating placeholder nodes.
 * Uses package name consistently for both node IDs and metadata.
 *
 * @param sourceModuleId - ID of importing module
 * @param referencedModuleId - ID of external module
 * @param moduleSpecifier - Package name of external module
 * @param namedImports - Array of named import specifiers to map
 */
function mapExternalNamedImports(
  sourceModuleId: string,
  referencedModuleId: string,
  moduleSpecifier: string,
  namedImports: ImportSpecifier[]
): MappingResult<typeof ModuleDataSchema> {
  return namedImports.reduce<MappingResult<typeof ModuleDataSchema>>(
    (acc, namedImport) => {
      const entityName = namedImport.getName();
      const alias = namedImport.getAliasNode()?.getText() ?? null;

      // For external imports, use package name in node ID
      const referencedEntityId = generateNodeId(
        moduleSpecifier,
        TypeScriptNodeTypes.ExternalImportEntity,
        entityName
      );

      const entityData: ExternalImportEntityData = {
        entityType: TypeScriptNodeTypes.ExternalImportEntity,
      };

      const node = createExternalImportEntityNode(
        referencedEntityId,
        entityName,
        TypeScriptExportValues.External,
        TypeScriptNodeStatus.Resolved,
        createEmptySourceLocation(),
        entityData
      );

      const edges = [
        createTypeScriptEdge(
          generateEdgeId(
            sourceModuleId,
            TypeScriptEdgeRelationshipValues.ModuleImportsNamed,
            referencedEntityId
          ),
          sourceModuleId,
          referencedEntityId,
          TypeScriptEdgeRelationshipValues.ModuleImportsNamed
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

      // Use package name in import metadata
      const importData = createNamedImport(moduleSpecifier, entityName, alias);

      return {
        nodes: [...acc.nodes, node],
        edges: [...acc.edges, ...edges],
        data: {
          imports: {
            named: [...(acc.data?.imports?.named ?? []), importData],
            namespaces: [],
            defaults: [],
          },
        },
      };
    },
    createMappingResult(ModuleDataSchema, [], [], {
      imports: { named: [], namespaces: [], defaults: [] },
    })
  );
}
