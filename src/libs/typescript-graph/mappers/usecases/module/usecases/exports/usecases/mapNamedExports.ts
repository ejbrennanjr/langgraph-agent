/**
 * @fileoverview Named Export Mapper
 * Maps named export declarations to domain nodes and edges.
 */

import { ExportDeclaration, SourceFile, SyntaxKind } from "ts-morph";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  createTypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { TypeScriptNodeStatus } from "@/libs/typescript-graph/domain/TypeScriptNode";

import {
  createExportedEntity,
  ModuleDataSchema,
} from "@/libs/typescript-graph/domain/ModuleNode";

import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";

import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";
import { getFactoryForEntity } from "@/libs/typescript-graph/mappers/utils/getFactoryForEntity";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";

/**
 * Maps named export declarations to domain nodes and edges.
 * Handles exports of the form: export { X, Y as Z }
 *
 * Path Handling:
 * - Uses full file paths for node IDs and edges
 * - Maintains original names in export metadata
 *
 * @param sourceFile - The source file being processed
 * @param sourceModuleId - ID of the source module
 * @param exportDecl - The export declaration to process
 * @returns MappingResult containing nodes, edges, and export metadata
 */
export function mapNamedExports(
  sourceFile: SourceFile,
  sourceModuleId: string,
  exportDecl: ExportDeclaration
): MappingResult<typeof ModuleDataSchema> {
  const namedExports = exportDecl.getNamedExports();

  if (!namedExports.length) {
    return createMappingResult(ModuleDataSchema, [], [], {
      exports: {
        named: [],
        reExports: [],
        wildcards: [],
      },
    });
  }

  const result = namedExports.map((namedExport) => {
    const localName = namedExport.getName();
    const alias = namedExport.getAliasNode()?.getText() ?? null;
    const exportedName = alias || localName;

    const symbol = namedExport.getSymbol();
    const aliasedSymbol = symbol?.getAliasedSymbol() ?? symbol;
    const declarationNode = aliasedSymbol?.getDeclarations()?.[0];

    if (!declarationNode) {
      console.warn(
        `Warning: Could not resolve the declaration of named export: ${localName}`
      );
      return createMappingResult(ModuleDataSchema, [], [], {
        exports: {
          named: [],
          reExports: [],
          wildcards: [],
        },
      });
    }

    const entityType = getEntityType(declarationNode);

    // Generate node ID using full path
    const exportedEntityId = generateNodeId(
      sourceFile.getFilePath(),
      entityType,
      exportedName
    );

    const factoryFn = getFactoryForEntity(entityType);

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
        TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
        exportedEntityId
      ),
      sourceModuleId,
      exportedEntityId,
      TypeScriptEdgeRelationshipValues.ModuleExportsNamed
    );

    // Use original names in metadata
    return createMappingResult(ModuleDataSchema, [exportNode], [exportEdge], {
      exports: {
        named: [createExportedEntity(exportedName, localName)],
        reExports: [],
        wildcards: [],
      },
    });
  });

  return combineMappingResults(ModuleDataSchema, result);
}
