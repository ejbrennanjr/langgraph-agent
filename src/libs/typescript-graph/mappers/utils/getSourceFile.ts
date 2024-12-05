/**
 * @fileoverview Source file retrieval utility
 * Manages access to TypeScript source files within the project context,
 * handling both existing and new file additions.
 */

import { Project, SourceFile } from "ts-morph";

/**
 * Retrieves or adds a source file to the ts-morph project.
 * Ensures consistent error handling and file access patterns.
 *
 * @param project - ts-morph Project instance for TypeScript analysis
 * @param filePath - Path to the TypeScript file
 * @returns The source file instance
 * @throws Error if the file cannot be accessed or parsed
 */
export function getSourceFile(project: Project, filePath: string): SourceFile {
  try {
    return (
      project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath)
    );
  } catch (error) {
    throw new Error(
      `Failed to process source file: ${filePath}. ${(error as Error).message}`
    );
  }
}
