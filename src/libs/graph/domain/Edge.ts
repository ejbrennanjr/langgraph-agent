import { z } from "zod";

/**
 * EdgeSchema
 *
 * Defines the structure for an "Edge" object within a graph, where each edge represents a connection
 * between two nodes, identified by a source and target node.
 *
 * The schema enforces the following requirements:
 * - `id` (string): A unique identifier for the edge, ensuring each edge can be uniquely referenced.
 * - `source` (string): The source node's ID, specifying where the edge originates.
 * - `target` (string): The target node's ID, indicating where the edge points.
 * - `label` (string | optional): An optional label for describing the edge, allowing for additional
 *   context or meaning. If provided, it must be a string.
 *
 * This schema enforces a strict object structure, allowing only the specified properties.
 *
 * @returns A Zod schema for an edge object with required fields `id`, `source`, and `target`,
 *          and an optional `label`.
 */
export const EdgeSchema = () =>
  z
    .object({
      id: z.string().min(1, "Edge ID cannot be empty"), // Requires non-empty string
      source: z.string().min(1, "Source cannot be empty"), // Requires non-empty string
      target: z.string().min(1, "Target cannot be empty"), // Requires non-empty string
      label: z.string().optional(),
    })
    .strict();

/**
 * Edge Type Definition
 *
 * Represents the TypeScript type for an edge object as defined by the EdgeSchema.
 * Utilizes Zod's `infer` utility to derive the type based on the EdgeSchema definition.
 *
 * This type serves as a reference throughout the codebase, ensuring consistent structure
 * and type safety for edge objects that adhere to the EdgeSchema format.
 */
export type Edge = z.infer<ReturnType<typeof EdgeSchema>>;
