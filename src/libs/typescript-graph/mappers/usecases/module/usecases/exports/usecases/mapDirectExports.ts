/**
 * @fileoverview Direct Export Mapper
 * Maps export declarations (export class X) to domain nodes and edges.
 */

import { ExportedDeclarations, SourceFile } from "ts-morph";

import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import {
  ModuleDataSchema,
  createExportedEntity,
} from "@/libs/typescript-graph/domain/ModuleNode";

import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";

import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";

import {
  createTypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";
import { getFactoryForEntity } from "@/libs/typescript-graph/mappers/utils/getFactoryForEntity";
import { createEmptySourceLocation } from "@/libs/typescript-graph/mappers/usecases/module/utils/createEmptySourceLocation";

/**
 * Maps direct export declarations to domain nodes and edges.
 * Handles declarations like:
 * - export class X {}
 * - export function y() {}
 * - export const z = ...
 * - export default class X {}
 *
 * @param sourceFile - The source file containing the exports
 * @param sourceModuleId - ID of the module being analyzed
 * @param exportedDeclarations - Map of exported declarations from source file
 * @returns MappingResult with export nodes, edges, and module data
 *
 * @example
 * ```typescript
 * // For exports:
 * export class UserService {}
 * export default class AdminService {}
 *
 * const result = mapDirectExports(sourceFile, moduleId, declarations);
 * // Returns nodes and edges for UserService and AdminService
 * // with appropriate ModuleExportsNamed/Default relationships
 * ```
 */
export function mapDirectExports(
  sourceFile: SourceFile,
  sourceModuleId: string,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>
): MappingResult<typeof ModuleDataSchema> {
  const results = Array.from(exportedDeclarations.entries())
    .map(([exportName, decls]) =>
      decls
        // Filter to include only declarations directly in the current source file
        .filter((decl) => decl.getSourceFile() === sourceFile)
        .map((decl) => {
          const isDefault = exportName === "default";

          const declarationNode = decl.getSymbol()?.getDeclarations()?.[0];
          if (!declarationNode) {
            return createMappingResult(ModuleDataSchema, [], [], {});
          }

          const entityType = getEntityType(declarationNode);
          const localName = decl.getSymbol()?.getName() ?? exportName;

          // Use full file path for node ID generation
          const entityId = generateNodeId(
            sourceFile.getFilePath(), // Full path for node ID
            entityType,
            localName
          );

          const factoryFn = getFactoryForEntity(entityType);
          const node = factoryFn(
            entityId,
            localName,
            TypeScriptExportValues.Internal,
            TypeScriptNodeStatus.Placeholder,
            createEmptySourceLocation(),
            {}
          );

          const edge = createTypeScriptEdge(
            generateEdgeId(
              sourceModuleId,
              isDefault
                ? TypeScriptEdgeRelationshipValues.ModuleExportsDefault
                : TypeScriptEdgeRelationshipValues.ModuleExportsNamed,
              entityId
            ),
            sourceModuleId,
            entityId,
            isDefault
              ? TypeScriptEdgeRelationshipValues.ModuleExportsDefault
              : TypeScriptEdgeRelationshipValues.ModuleExportsNamed
          );

          // Use original names in export metadata
          const exportEntity = createExportedEntity(exportName, localName);

          return createMappingResult(ModuleDataSchema, [node], [edge], {
            exports: {
              named: isDefault ? [] : [exportEntity],
              reExports: [],
              wildcards: [],
              default: isDefault ? exportEntity : undefined,
            },
          });
        })
    )
    .flat();

  return combineMappingResults(ModuleDataSchema, results);
}
