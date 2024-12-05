import { z } from "zod";
import { combineMappingResults } from "@/libs/typescript-graph/mappers/utils/combineMappingResults";
import { TypeScriptExportValues } from "@/libs/typescript-graph/domain/libs/TypeScriptFoundations";
import {
  TypeScriptNode,
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/libs/typescript-graph/domain/TypeScriptNode";
import {
  TypeScriptEdge,
  TypeScriptEdgeRelationshipValues,
} from "@/libs/typescript-graph/domain/TypeScriptEdge";

describe("combineMappingResults", () => {
  const TestSchema = z.object({
    metadata: z
      .object({
        description: z.string().default("No description"),
        tags: z.array(z.string()).default([]),
        priority: z.number().default(0),
      })
      .default({}),
    counts: z
      .object({
        total: z.number().default(0),
        active: z.number().default(0),
      })
      .default({}),
    items: z.array(z.string()).default([]),
  });

  const createMockNode = (id: string): TypeScriptNode<z.ZodAny> => ({
    id,
    name: `Node${id}`,
    type: TypeScriptNodeTypes.Class,
    scope: TypeScriptExportValues.Internal,
    status: TypeScriptNodeStatus.Resolved,
    location: {
      filePath: `/mock/${id}.ts`,
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 1,
    },
    data: {},
  });

  const createMockEdge = (id: string): TypeScriptEdge => ({
    id,
    source: `source${id}`,
    target: `target${id}`,
    label: TypeScriptEdgeRelationshipValues.ModuleDependsOn,
  });

  describe("basic functionality", () => {
    it("should merge nodes and edges from multiple results", () => {
      const result1 = {
        nodes: [createMockNode("1")],
        edges: [createMockEdge("1")],
        data: { items: ["item1"] },
      };

      const result2 = {
        nodes: [createMockNode("2")],
        edges: [createMockEdge("2")],
        data: { items: ["item2"] },
      };

      const combined = combineMappingResults(TestSchema, [result1, result2]);

      expect(combined.nodes).toHaveLength(2);
      expect(combined.edges).toHaveLength(2);
      expect(combined.data.items).toEqual(["item1", "item2"]);
    });

    it("should preserve defaults from schema", () => {
      const result = combineMappingResults(TestSchema, [
        {
          nodes: [],
          edges: [],
          data: {},
        },
      ]);

      expect(result.data.metadata.description).toBe("No description");
      expect(result.data.counts.total).toBe(0);
      expect(result.data.items).toEqual([]);
    });
  });

  describe("data merging rules", () => {
    it("should keep first non-default string value", () => {
      const result1 = {
        nodes: [],
        edges: [],
        data: { metadata: { description: "First description" } },
      };

      const result2 = {
        nodes: [],
        edges: [],
        data: { metadata: { description: "Second description" } },
      };

      const combined = combineMappingResults(TestSchema, [result1, result2]);
      expect(combined.data.metadata.description).toBe("First description");
    });

    it("should take latest non-zero number value", () => {
      const result1 = {
        nodes: [],
        edges: [],
        data: { counts: { total: 5, active: 2 } },
      };

      const result2 = {
        nodes: [],
        edges: [],
        data: { counts: { total: 3, active: 0 } },
      };

      const combined = combineMappingResults(TestSchema, [result1, result2]);
      expect(combined.data.counts.total).toBe(3);
      expect(combined.data.counts.active).toBe(2);
    });

    it("should concatenate arrays", () => {
      const result1 = {
        nodes: [],
        edges: [],
        data: { metadata: { tags: ["tag1"] }, items: ["item1"] },
      };

      const result2 = {
        nodes: [],
        edges: [],
        data: { metadata: { tags: ["tag2"] }, items: ["item2"] },
      };

      const combined = combineMappingResults(TestSchema, [result1, result2]);
      expect(combined.data.metadata.tags).toEqual(["tag1", "tag2"]);
      expect(combined.data.items).toEqual(["item1", "item2"]);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined and null values in data", () => {
      const result1 = {
        nodes: [],
        edges: [],
        data: { metadata: { description: undefined, tags: [] } }, // Changed null to empty array
      };

      const result2 = {
        nodes: [],
        edges: [],
        data: { metadata: { description: "Valid description", tags: ["tag"] } },
      };

      const combined = combineMappingResults(TestSchema, [result1, result2]);
      expect(combined.data.metadata.description).toBe("Valid description");
      expect(combined.data.metadata.tags).toEqual(["tag"]);
    });

    it("should handle single result", () => {
      const result = {
        nodes: [createMockNode("1")],
        edges: [createMockEdge("1")],
        data: {
          metadata: { description: "Test", tags: [], priority: 0 },
          counts: { total: 0, active: 0 },
          items: [],
        },
      };

      const combined = combineMappingResults(TestSchema, [result]);
      expect(combined).toEqual(result);
    });
  });
});
