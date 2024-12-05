// libs/typescript-graph/mappers/module/utils/createEmptySourceLocation.ts

import {
  SourceLocation,
  SourceLocationSchema,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * Creates a default empty SourceLocation object.
 * Ensures consistent defaults aligned with the SourceLocationSchema.
 *
 * @returns An empty SourceLocation with default values.
 */
export function createEmptySourceLocation(): SourceLocation {
  return SourceLocationSchema.parse({
    filePath: "",
    startLine: 0,
    startColumn: 0,
    endLine: 0,
    endColumn: 0,
  });
}
