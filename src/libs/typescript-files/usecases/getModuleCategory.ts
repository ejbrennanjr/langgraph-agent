import { getImportPathType } from "@/libs/typescript-files/usecases/getImportPathType";
import { ImportPathType } from "@/libs/typescript-files/domain/ImportPathType";
import { ModuleCategory } from "@/libs/typescript-files/domain/ModuleCategory";

/**
 * Determines if an import path is classified as an External or Internal module.
 *
 * @param moduleSpecifier - The import path string to classify
 * @returns The ModuleCategory enum value representing if the module is external or internal
 */
export function getModuleCategory(moduleSpecifier: string): ModuleCategory {
  const importType = getImportPathType(moduleSpecifier);

  // Map each ImportPathType to the appropriate ModuleCategory
  switch (importType) {
    case ImportPathType.NpmModule:
    case ImportPathType.NodeBuiltInModule:
      return ModuleCategory.External;

    case ImportPathType.RelativePath:
    case ImportPathType.AbsolutePath:
    case ImportPathType.AliasPath:
      return ModuleCategory.Internal;

    default:
      throw new Error(
        `Unrecognized import type for module specifier: ${moduleSpecifier}`
      );
  }
}
