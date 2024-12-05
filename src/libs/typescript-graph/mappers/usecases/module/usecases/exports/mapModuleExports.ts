/**
 * @fileoverview Module Exports Mapper
 *
 * This mapper processes all export declarations in a TypeScript module, creating nodes
 * for exported entities (classes, functions, constants, etc.) and establishing relationships
 * between the source module and its exports. It delegates to specialized mappers for different
 * types of exports.
 *
 * The mapper handles:
 * - Named exports: `export { X, Y as Z }`
 * - Re-exports: `export { X } from 'module'`, `export * from 'module'`
 * - Direct exports: `export class X {}`, `export function Y() {}`
 * - Default exports: `export default class X {}`
 *
 * @path @/libs/typescript-graph/mappers/usecases/module/usecases/exports/mapModuleExports.ts
 */

import { SourceFile } from "ts-morph";
import { ModuleDataSchema } from "@/libs/typescript-graph/domain/ModuleNode";
import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import {
  createMappingResult,
  MappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";

import { mapNamedExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapNamedExports";
import { mapReExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapReExports";
import { mapDirectExports } from "@/libs/typescript-graph/mappers/usecases/module/usecases/exports/usecases/mapDirectExports";

/**
 * Maps all exports in a TypeScript module to domain nodes and edges.
 *
 * This function:
 * 1. Delegates to specialized mappers for processing different export types.
 * 2. Combines results from all export processing into a single `MappingResult`.
 *
 * For each export declaration:
 * - Processes named exports via `mapNamedExports`.
 * - Processes re-exports via `mapReExports`.
 * - Processes direct and default exports via `mapDirectExports`.
 *
 * Subtle Difference Between Export Declarations and Exported Declarations:
 * - `sourceFile.getExportDeclarations()` retrieves **export statements** like
 *   `export { X }`, `export * from 'module'`, or `export default`.
 * - `sourceFile.getExportedDeclarations()` retrieves **directly exported entities**
 *   like classes, functions, or variables declared with `export` (e.g., `export class X {}`).
 *
 * This distinction ensures that both types of exports are processed correctly.
 *
 * @param sourceFile - The TypeScript source file being analyzed.
 * @param sourceModuleId - The unique identifier of the source module.
 *
 * @returns MappingResult containing:
 *   - `nodes`: Exported entity nodes.
 *   - `edges`: Export relationships between the source module and its entities.
 *   - `data`: Complete export metadata.
 */
export function mapModuleExports(
  sourceFile: SourceFile,
  sourceModuleId: string
): MappingResult<typeof ModuleDataSchema> {
  // ========================================================================
  // Step 1: Handle Export Declarations (e.g., named exports, re-exports)
  // ========================================================================
  // console.log("Processing source file:", sourceFile.getFilePath());
  const exportDeclarations = sourceFile.getExportDeclarations();

  // Log details about each export declaration
  // exportDeclarations.forEach((exportDecl, index) => {
  //   const moduleSpecifier =
  //     exportDecl.getModuleSpecifier()?.getText() ?? "None";
  //   const hasNamedExports = exportDecl.hasNamedExports();
  //   const isWildcard = !hasNamedExports && !!moduleSpecifier;

  //   console.log(`Export Declaration ${index + 1}:`);
  //   console.log("  Text:", exportDecl.getText());
  //   console.log("  Module Specifier:", moduleSpecifier);
  //   console.log(
  //     "  Type:",
  //     hasNamedExports
  //       ? "Named Export"
  //       : isWildcard
  //       ? "Wildcard Re-Export"
  //       : "Default/Other Export"
  //   );
  // });

  // Process each `ExportDeclaration` using the appropriate specialized mapper
  const exportDeclarationResults = exportDeclarations
    .map((exportDecl) => {
      const moduleSpecifier = exportDecl.getModuleSpecifier();
      const isReExport = !!moduleSpecifier;

      if (isReExport && exportDecl.hasNamedExports()) {
        // Named re-exports (e.g., `export { X as Y } from './module';` or
        // `export type { UserProfile as Profile } from './user';`)
        // console.log("Re-exports (Named):", exportDecl.getText());
        return mapReExports(sourceFile, sourceModuleId, exportDecl);
      } else if (exportDecl.hasNamedExports()) {
        // Named exports (e.g., `export { X, Y as Z };` or
        // `export const A = ...;`)
        // console.log("Named exports:", exportDecl.getText());
        return mapNamedExports(sourceFile, sourceModuleId, exportDecl);
      } else if (isReExport) {
        // Wildcard re-exports (e.g., `export * from './module';`)
        // console.log("Re-exports (Wildcard):", exportDecl.getText());
        return mapReExports(sourceFile, sourceModuleId, exportDecl);
      }

      // Default or unsupported export declarations (e.g., `export default class X {};`)
      // console.log("Unsupported export declaration:", exportDecl.getText());
      return createMappingResult(ModuleDataSchema, [], [], {
        exports: {
          named: [],
          reExports: [],
          wildcards: [],
        },
      });
    })
    .filter((result) => result !== undefined); // Remove undefined results if any exist

  // ========================================================================
  // Step 2: Handle Direct Exports (e.g., `export class X {}`, `export default`)
  // ========================================================================
  const exportedDeclarations = sourceFile.getExportedDeclarations();
  // console.log("Direct exports:", Array.from(exportedDeclarations.keys()));
  // Use `mapDirectExports` to process all directly declared exports
  const directExportResults = mapDirectExports(
    sourceFile,
    sourceModuleId,
    exportedDeclarations
  );
  // console.log(directExportResults);
  // ========================================================================
  // Step 3: Combine Results into a Single MappingResult
  // ========================================================================
  // Combine results from both export declarations and direct exports
  return combineMappingResults(ModuleDataSchema, [
    ...exportDeclarationResults,
    directExportResults,
  ]);
}
