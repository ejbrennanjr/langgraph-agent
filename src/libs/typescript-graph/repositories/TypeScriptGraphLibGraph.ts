/**
 * @fileoverview TypeScript-specific graph implementation
 * Implements the IGraph interface for TypeScript analysis, working with TypeScript entities.
 * This implementation uses graphlib as the underlying graph data structure while
 * providing a type-safe API for TypeScript nodes and edges.
 */
import { Graph as GraphLib } from "graphlib";
import { z } from "zod";

import { Edge } from "@/libs/graph/domain/Edge";
import { IGraph } from "@/libs/graph/repositories/IGraph";

import { TypeScriptNode } from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * TypeScript-specific implementation of IGraph.
 * Provides a graph data structure optimized for TypeScript analysis,
 * working directly with TypeScript entities (ModuleNode, ClassNode, etc.).
 *
 * @implements {IGraph<TypeScriptNode<z.ZodTypeAny>, Edge>}
 *
 * Example usage:
 * ```typescript
 * const graph = new TypeScriptGraphLibGraph();
 *
 * // Adding nodes with type safety
 * const moduleNode = createModuleNode(...);
 * graph.addNode(moduleNode);
 *
 * // Getting nodes with correct types
 * const node = graph.getNode<ModuleNode>(id);
 * if (node?.type === TypeScriptNodeTypes.Module) {
 *   // TypeScript knows this is a ModuleNode
 *   console.log(node.data.imports);
 * }
 * ```
 */
export class TypeScriptGraphLibGraph
  implements IGraph<TypeScriptNode<z.ZodTypeAny>, Edge>
{
  /**
   * The underlying graphlib instance.
   * All graph operations are delegated to this instance.
   */
  private graph: GraphLib;

  /**
   * Initializes a new instance of TypeScriptGraphLibGraph.
   * Creates a directed graph using graphlib as the underlying implementation.
   */
  constructor() {
    this.graph = new GraphLib({ directed: true });
  }

  /**
   * Adds an edge to the graph.
   * The edge must have valid source and target node IDs.
   *
   * @param {Edge} edge - The edge to add
   * @throws {Error} If source or target nodes don't exist in the graph
   *
   * Example:
   * ```typescript
   * graph.addEdge({
   *   id: "edge1",
   *   source: "moduleA",
   *   target: "moduleB"
   * });
   * ```
   */
  addEdge(edge: Edge): void {
    this.graph.setEdge(edge.source, edge.target, edge);
  }

  /**
   * Adds a TypeScript node to the graph.
   * Accepts any node type that extends TypeScriptNode.
   *
   * @template T - The specific TypeScript node type
   * @param {T} node - The node to add
   *
   * Example:
   * ```typescript
   * const moduleNode = createModuleNode(...);
   * graph.addNode(moduleNode);
   *
   * const classNode = createClassNode(...);
   * graph.addNode(classNode);
   * ```
   */
  addNode<T extends TypeScriptNode<z.ZodTypeAny>>(node: T): void {
    this.graph.setNode(node.id, node);
  }

  /**
   * Removes all nodes and edges from the graph.
   * Resets the graph to its initial empty state.
   */
  clear(): void {
    this.graph = new GraphLib({ directed: true });
  }

  /**
   * Retrieves all edges in the graph.
   * @returns {Edge[]} Array of all edges
   * Returns an empty array if the graph has no edges.
   */
  getAllEdges(): Edge[] {
    return this.graph.edges().map((e) => this.graph.edge(e) as Edge);
  }

  /**
   * Retrieves all nodes of a specific type from the graph.
   *
   * @template T - The specific TypeScript node type to retrieve
   * @returns {T[]} Array of nodes of the specified type
   * Returns an empty array if no nodes of the specified type exist.
   *
   * Example:
   * ```typescript
   * // Get all module nodes
   * const modules = graph.getAllNodes<ModuleNode>();
   *
   * // Get all class nodes
   * const classes = graph.getAllNodes<ClassNode>();
   * ```
   */
  getAllNodes<T extends TypeScriptNode<z.ZodTypeAny>>(): T[] {
    return this.graph.nodes().map((n) => this.graph.node(n) as T);
  }

  /**
   * Retrieves an edge by its ID.
   *
   * @param {string} id - The edge ID to find
   * @returns {Edge | undefined} The edge if found, undefined otherwise
   */
  getEdge(id: string): Edge | undefined {
    const edges = this.graph.edges();
    const found = edges.find((e) => (this.graph.edge(e) as Edge).id === id);
    return found ? (this.graph.edge(found) as Edge) : undefined;
  }

  /**
   * Returns the total number of edges in the graph.
   * @returns {number} The edge count
   */
  getEdgeCount(): number {
    return this.graph.edgeCount();
  }

  /**
   * Retrieves a node of a specific type by its ID.
   *
   * @template T - The specific TypeScript node type to retrieve
   * @param {string} id - The node ID to find
   * @returns {T | undefined} The node if found, undefined otherwise
   *
   * Example:
   * ```typescript
   * const moduleNode = graph.getNode<ModuleNode>("module1");
   * if (moduleNode?.type === TypeScriptNodeTypes.Module) {
   *   // Work with module-specific properties
   *   console.log(moduleNode.data.imports);
   * }
   * ```
   */
  getNode<T extends TypeScriptNode<z.ZodTypeAny>>(id: string): T | undefined {
    return this.graph.node(id) as T | undefined;
  }

  /**
   * Returns the total number of nodes in the graph.
   * @returns {number} The node count
   */
  getNodeCount(): number {
    return this.graph.nodeCount();
  }

  /**
   * Retrieves all edges that point to the specified node.
   *
   * @param {string} nodeId - The ID of the node to find predecessor edges for
   * @returns {Edge[]} Array of predecessor edges
   * Returns an empty array if the node has no predecessors or doesn't exist.
   */
  getPredecessorEdges(nodeId: string): Edge[] {
    return (
      this.graph.inEdges(nodeId)?.map((e) => this.graph.edge(e) as Edge) || []
    );
  }

  /**
   * Retrieves all nodes that point to the specified node.
   *
   * @template T - The specific TypeScript node type to retrieve
   * @param {string} nodeId - The ID of the node to find predecessors for
   * @returns {T[]} Array of predecessor nodes
   * Returns an empty array if the node has no predecessors or doesn't exist.
   *
   * Example:
   * ```typescript
   * // Get all modules that import a specific module
   * const importers = graph.getPredecessorNodes<ModuleNode>("moduleA");
   * ```
   */
  getPredecessorNodes<T extends TypeScriptNode<z.ZodTypeAny>>(
    nodeId: string
  ): T[] {
    return (
      this.graph.predecessors(nodeId)?.map((n) => this.graph.node(n) as T) || []
    );
  }

  /**
   * Retrieves all edges that originate from the specified node.
   *
   * @param {string} nodeId - The ID of the node to find successor edges for
   * @returns {Edge[]} Array of successor edges
   * Returns an empty array if the node has no successors or doesn't exist.
   */
  getSuccessorEdges(nodeId: string): Edge[] {
    return (
      this.graph.outEdges(nodeId)?.map((e) => this.graph.edge(e) as Edge) || []
    );
  }

  /**
   * Retrieves all nodes that the specified node points to.
   *
   * @template T - The specific TypeScript node type to retrieve
   * @param {string} nodeId - The ID of the node to find successors for
   * @returns {T[]} Array of successor nodes
   * Returns an empty array if the node has no successors or doesn't exist.
   *
   * Example:
   * ```typescript
   * // Get all modules imported by a specific module
   * const imports = graph.getSuccessorNodes<ModuleNode>("moduleA");
   * ```
   */
  getSuccessorNodes<T extends TypeScriptNode<z.ZodTypeAny>>(
    nodeId: string
  ): T[] {
    return (
      this.graph.successors(nodeId)?.map((n) => this.graph.node(n) as T) || []
    );
  }

  /**
   * Removes an edge from the graph.
   * Has no effect if the edge doesn't exist.
   *
   * @param {string} id - The ID of the edge to remove
   */
  removeEdge(id: string): void {
    const edge = this.getEdge(id);
    if (edge) {
      this.graph.removeEdge(edge.source, edge.target);
    }
  }

  /**
   * Removes a node and all its incident edges from the graph.
   * Has no effect if the node doesn't exist.
   *
   * @param {string} id - The ID of the node to remove
   */
  removeNode(id: string): void {
    this.graph.removeNode(id);
  }

  /**
   * Updates an existing edge in the graph.
   * If the edge doesn't exist, it will be added.
   *
   * @param {Edge} edge - The edge with updated information
   */
  updateEdge(edge: Edge): void {
    this.graph.setEdge(edge.source, edge.target, edge);
  }

  /**
   * Updates an existing node in the graph.
   * If the node doesn't exist, it will be added.
   *
   * @template T - The specific TypeScript node type to update
   * @param {T} node - The node with updated information
   *
   * Example:
   * ```typescript
   * const moduleNode = graph.getNode<ModuleNode>(id);
   * if (moduleNode) {
   *   moduleNode.status = TypeScriptNodeStatus.Resolved;
   *   graph.updateNode(moduleNode);
   * }
   * ```
   */
  updateNode<T extends TypeScriptNode<z.ZodTypeAny>>(node: T): void {
    this.graph.setNode(node.id, node);
  }
}
