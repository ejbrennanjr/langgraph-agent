/**
 * @fileoverview Create Graph
 * Orchestrates the processing of TypeScript files into a graph structure, handling module
 * and entity processing.
 */

import { Project } from "ts-morph";
import { z } from "zod";

import { IGraph } from "@/libs/graph/repositories/IGraph";

import { TypeScriptEdge } from "@/libs/typescript-graph/domain/TypeScriptEdge";
import {
  TypeScriptNode,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";

import { mapModule } from "@/libs/typescript-graph/mappers/usecases/module/mapModule";

/**
 * Processes a specific TypeScript file into a graph structure, handling both
 * module-level mapping and entity-level processing.
 *
 * @param graph - The graph instance for storing processed nodes and relationships
 * @param project - ts-morph Project instance for TypeScript analysis
 * @param filePath - Path to the TypeScript file
 * @param entityName - Name of the entity to process
 * @param entityType - Type of the entity (class, function, etc.)
 */
export function createGraph(
  graph: IGraph<TypeScriptNode<z.ZodTypeAny>, TypeScriptEdge>,
  project: Project,
  filePath: string,
  entityName: string,
  entityType: TypeScriptNodeTypes
): void {
  // Step 1: Parse the source file
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`Source file not found: ${filePath}`);
  }

  // Step 2: Map the module
  const moduleMappingResult = mapModule(sourceFile);

  // TODO: Add nodes and edges from moduleMappingResult to the graph
  // - Iterate over moduleMappingResult.nodes and add them to the graph
  // - Iterate over moduleMappingResult.edges and add them to the graph

  // TODO: Process entity within the module
  // - Identify the ModuleNode in the result
  // - Use createEntityProcessor to process the entity
  // - Handle any specific logic for the entity type
}
