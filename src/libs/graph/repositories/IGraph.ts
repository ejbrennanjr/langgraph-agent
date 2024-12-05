/**
 * @fileoverview Core graph interface definition
 * Provides the contract for graph data structures with configurable node and edge types.
 * This interface operates at the entity level rather than implementation level,
 * allowing users to work with their specific node and edge types directly.
 */

/**
 * IGraph interface defines the contract for graph operations.
 * It provides methods for managing nodes and edges, as well as graph traversal and querying.
 *
 * @template N - The base node type for the graph
 * @template E - The base edge type for the graph
 *
 * Type parameters allow implementations to specify concrete types for nodes and edges
 * while maintaining the graph operation contract. For example:
 *
 * ```typescript
 * // Basic implementation
 * class SimpleGraph implements IGraph<BaseNode, BaseEdge> {...}
 *
 * // TypeScript analysis implementation
 * class TSGraph implements IGraph<TypeScriptNode<z.ZodTypeAny>, Edge> {...}
 * ```
 */
export interface IGraph<N, E> {
  /**
   * Adds a new edge to the graph.
   * @param {E} edge - The edge to be added.
   * @throws {Error} Implementation-specific validation errors
   */
  addEdge(edge: E): void;

  /**
   * Adds a new node to the graph.
   * @template T - The specific node type extending the base node type N
   * @param {T} node - The node to be added.
   * @throws {Error} Implementation-specific validation errors
   *
   * The type parameter T allows adding nodes of specific types while maintaining
   * type safety. For example:
   * ```typescript
   * graph.addNode<ModuleNode>(moduleNode);
   * graph.addNode<ClassNode>(classNode);
   * ```
   */
  addNode<T extends N>(node: T): void;

  /**
   * Clears all nodes and edges from the graph.
   * After this operation, the graph will be empty.
   */
  clear(): void;

  /**
   * Retrieves all edges in the graph.
   * @returns {E[]} An array of all edges in the graph.
   * Returns an empty array if the graph has no edges.
   */
  getAllEdges(): E[];

  /**
   * Retrieves all nodes in the graph.
   * @template T - The specific node type extending the base node type N
   * @returns {T[]} An array of all nodes in the graph.
   * Returns an empty array if the graph has no nodes.
   *
   * The type parameter T allows retrieving nodes as specific types:
   * ```typescript
   * const moduleNodes = graph.getAllNodes<ModuleNode>();
   * ```
   */
  getAllNodes<T extends N>(): T[];

  /**
   * Retrieves an edge from the graph by its ID.
   * @param {string} id - The unique identifier of the edge.
   * @returns {E | undefined} The edge if found, otherwise undefined.
   */
  getEdge(id: string): E | undefined;

  /**
   * Returns the total number of edges in the graph.
   * @returns {number} The count of edges.
   */
  getEdgeCount(): number;

  /**
   * Retrieves a node from the graph by its ID.
   * @template T - The specific node type extending the base node type N
   * @param {string} id - The unique identifier of the node.
   * @returns {T | undefined} The node if found, otherwise undefined.
   *
   * The type parameter T allows retrieving nodes as specific types:
   * ```typescript
   * const moduleNode = graph.getNode<ModuleNode>(id);
   * if (moduleNode?.type === TypeScriptNodeTypes.Module) {
   *   // TypeScript knows this is a ModuleNode
   * }
   * ```
   */
  getNode<T extends N>(id: string): T | undefined;

  /**
   * Returns the total number of nodes in the graph.
   * @returns {number} The count of nodes.
   */
  getNodeCount(): number;

  /**
   * Retrieves all edges connecting to predecessor nodes of a given node.
   * @param {string} nodeId - The ID of the node to find predecessor edges for.
   * @returns {E[]} An array of predecessor edges.
   * Returns an empty array if the node has no predecessors or the node doesn't exist.
   */
  getPredecessorEdges(nodeId: string): E[];

  /**
   * Retrieves all predecessor nodes of a given node.
   * @template T - The specific node type extending the base node type N
   * @param {string} nodeId - The ID of the node to find predecessors for.
   * @returns {T[]} An array of predecessor nodes.
   * Returns an empty array if the node has no predecessors or the node doesn't exist.
   */
  getPredecessorNodes<T extends N>(nodeId: string): T[];

  /**
   * Retrieves all edges connecting to successor nodes of a given node.
   * @param {string} nodeId - The ID of the node to find successor edges for.
   * @returns {E[]} An array of successor edges.
   * Returns an empty array if the node has no successors or the node doesn't exist.
   */
  getSuccessorEdges(nodeId: string): E[];

  /**
   * Retrieves all successor nodes of a given node.
   * @template T - The specific node type extending the base node type N
   * @param {string} nodeId - The ID of the node to find successors for.
   * @returns {T[]} An array of successor nodes.
   * Returns an empty array if the node has no successors or the node doesn't exist.
   */
  getSuccessorNodes<T extends N>(nodeId: string): T[];

  /**
   * Removes an edge from the graph by its ID.
   * @param {string} id - The unique identifier of the edge to be removed.
   * No effect if the edge doesn't exist.
   */
  removeEdge(id: string): void;

  /**
   * Removes a node from the graph by its ID.
   * @param {string} id - The unique identifier of the node to be removed.
   * When a node is removed, all its incident edges are also removed.
   * No effect if the node doesn't exist.
   */
  removeNode(id: string): void;

  /**
   * Updates an existing edge in the graph.
   * @param {E} edge - The edge with updated information.
   * @throws {Error} Implementation-specific validation errors
   * If the edge doesn't exist, behavior is implementation-dependent.
   */
  updateEdge(edge: E): void;

  /**
   * Updates an existing node in the graph.
   * @template T - The specific node type extending the base node type N
   * @param {T} node - The node with updated information.
   * @throws {Error} Implementation-specific validation errors
   * If the node doesn't exist, behavior is implementation-dependent.
   */
  updateNode<T extends N>(node: T): void;
}
