import { Node } from "ts-morph";
import {
  isExportableFunction,
  isExportableClass,
  isExportableVariable,
  isExportableEnum,
} from "./typeGuards";
import { ExportScopeType } from "../enums";

/**
 * Determines the export scope of a given declaration.
 * This function checks if the node is exportable and retrieves its export status,
 * categorizing it as "default export", "named export", or "internal".
 *
 * @param declaration - The node to check for export scope.
 * @returns {ExportScope} - The scope of the declaration:
 * - `"default export"` if the node is the module's default export.
 * - `"named export"` if the node is explicitly exported.
 * - `"internal"` if the node is not exported.
 */
export function getExportScope(declaration: Node): ExportScopeType {
  // Check if the node is an exportable entity
  if (
    isExportableFunction(declaration) ||
    isExportableClass(declaration) ||
    isExportableVariable(declaration) ||
    isExportableEnum(declaration)
  ) {
    if (declaration.isDefaultExport?.()) return ExportScopeType.Default;
    if (declaration.isExported?.()) return ExportScopeType.Named;
  }
  return ExportScopeType.Internal;
}
