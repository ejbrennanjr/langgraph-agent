import { SourceFile } from "ts-morph";
import { FilePathType } from "../enums";

/**
 * Utility to resolve the file path of a source file, returning "unresolved" if the path is empty.
 *
 * This function standardizes how unresolved file paths are handled across processors,
 * ensuring consistency in how nodes are created for unresolved or in-memory files.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file.
 * @returns The resolved file path, or "unresolved" if the file path cannot be determined.
 */
export function getResolvedFilePath(sourceFile: SourceFile): string {
  return sourceFile.getFilePath() || FilePathType.Unresolved;
}
