/**
 * @fileoverview Source location utility
 * Provides consistent source code location extraction for TypeScript nodes.
 * @path @/libs/typescript-graph/mappers/utils/getSourceLocation.ts
 */

import { Node, SourceFile } from "ts-morph";
import { SourceLocation } from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * Extracts source location information from a ts-morph Node or SourceFile.
 * For SourceFile, uses the full file span.
 * For other nodes, uses their specific position in the source.
 *
 * @param node - The node or source file to get location for
 * @returns Location information including file path and position
 */
export function getSourceLocation(node: Node | SourceFile): SourceLocation {
  const sourceFile = Node.isSourceFile(node) ? node : node.getSourceFile();

  if (Node.isSourceFile(node)) {
    const start = node.getStart();
    const end = node.getEnd();
    const startPos = node.getLineAndColumnAtPos(start);
    const endPos = node.getLineAndColumnAtPos(end);

    return {
      filePath: node.getFilePath(),
      startLine: startPos.line,
      startColumn: startPos.column,
      endLine: endPos.line,
      endColumn: endPos.column,
    };
  }

  const startPos = sourceFile.getLineAndColumnAtPos(node.getStart());
  const endPos = sourceFile.getLineAndColumnAtPos(node.getEnd());

  return {
    filePath: sourceFile.getFilePath(),
    startLine: startPos.line,
    startColumn: startPos.column,
    endLine: endPos.line,
    endColumn: endPos.column,
  };
}
