/**
 * @fileoverview Utility function for combining multiple mapping results
 * @path @/libs/typescript-graph/mappers/utils/combineMappingResults.ts
 */

import { z } from "zod";
import {
  MappingResult,
  MappingResultSchema,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";

/**
 * Combines multiple mapping results into a single result.
 * Useful for mappers that need to aggregate results from other mappers.
 * This version handles the generic data field by deep merging data objects.
 *
 * @template T - The Zod schema type for the data field
 *
 * @example
 * ```typescript
 * // Results with different data schemas
 * const result1 = {
 *   nodes: [{ id: "node1", ... }],
 *   edges: [{ source: "node1", target: "node2", ... }],
 *   data: { field1: ["value1"], nested: { a: 1 } }
 * };
 *
 * const result2 = {
 *   nodes: [{ id: "node3", ... }],
 *   edges: [{ source: "node3", target: "node4", ... }],
 *   data: { field1: ["value2"], nested: { b: 2 } }
 * };
 *
 * // Combining with schema validation
 * const combined = combineMappingResults(MyDataSchema, [result1, result2]);
 * // Result:
 * // {
 * //   nodes: [{ id: "node1", ... }, { id: "node3", ... }],
 * //   edges: [
 * //     { source: "node1", target: "node2", ... },
 * //     { source: "node3", target: "node4", ... }
 * //   ],
 * //   data: {
 * //     field1: ["value1", "value2"],
 * //     nested: { a: 1, b: 2 }
 * //   }
 * // }
 * ```
 *
 * @param dataSchema - Zod schema for validating the combined data
 * @param results - Array of mapping results to combine
 * @returns Combined mapping result with all nodes, edges, and merged data
 */
export function combineMappingResults<T extends z.ZodObject<any, any>>(
  dataSchema: T,
  results: MappingResult<T>[]
): MappingResult<T> {
  if (results.length === 0) {
    return MappingResultSchema(dataSchema).parse({
      nodes: [],
      edges: [],
      data: dataSchema.parse({}),
    });
  }

  const defaultData = dataSchema.parse({});
  const combined = results.reduce(
    (combined, current) => ({
      nodes: [...combined.nodes, ...current.nodes],
      edges: [...combined.edges, ...current.edges],
      data: deepMerge(
        combined.data || defaultData,
        current.data || {},
        defaultData
      ),
    }),
    { nodes: [], edges: [], data: dataSchema.parse({}) } as MappingResult<T>
  );

  return MappingResultSchema(dataSchema).parse(combined);
}

function deepMerge(target: any, source: any, defaults: any): any {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...target, ...source];
  }

  if (isObject(target) && isObject(source)) {
    const merged = { ...target };
    for (const key in source) {
      if (source[key] === undefined) continue;

      // Special handling for numbers - take the latest non-zero value
      if (typeof source[key] === "number" && typeof merged[key] === "number") {
        merged[key] = source[key] || merged[key];
        continue;
      }

      // For strings, keep first non-default value
      if (typeof source[key] === "string" && typeof merged[key] === "string") {
        merged[key] = isDefaultValue(merged[key], defaults?.[key])
          ? source[key]
          : merged[key];
        continue;
      }

      // For objects and arrays, recursively merge
      if (key in merged) {
        merged[key] = deepMerge(merged[key], source[key], defaults?.[key]);
      } else {
        merged[key] = source[key];
      }
    }
    return merged;
  }

  return isDefaultValue(target, defaults) ? source : target;
}

function isDefaultValue(value: any, defaultValue: any): boolean {
  return JSON.stringify(value) === JSON.stringify(defaultValue);
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}
