/**
 * @fileoverview Module kind determination utility
 * Analyzes TypeScript source files to determine their module type.
 * @path @/libs/typescript-graph/mappers/module/determineModuleKind.ts
 */

import { SourceFile, SyntaxKind } from "ts-morph";
import { ModuleKind } from "@/libs/typescript-graph/domain/ModuleNode";

/**
 * Determines the kind of module based on its syntax structure.
 * Analyzes module declarations to identify:
 * - Namespace modules (contains "." in module name)
 * - Ambient modules (declare module without ".")
 * - ES6 modules (default case)
 *
 * @param sourceFile - The source file to analyze
 * @returns The determined ModuleKind
 */
export function determineModuleKind(sourceFile: SourceFile): ModuleKind {
  const hasNamespaces = sourceFile
    .getDescendantsOfKind(SyntaxKind.ModuleDeclaration)
    .some((mod) => mod.getName().includes("."));

  const hasModuleDeclarations = sourceFile
    .getDescendantsOfKind(SyntaxKind.ModuleDeclaration)
    .some((mod) => !mod.getName().includes("."));

  if (hasNamespaces) return ModuleKind.Namespace;
  if (hasModuleDeclarations) return ModuleKind.Ambient;
  return ModuleKind.ES6;
}
