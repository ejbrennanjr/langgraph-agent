import { z } from "zod";
import {
  MappingResultSchema,
  createEmptyMappingResult,
  createMappingResult,
  createPartialMappingResult,
} from "@/libs/typescript-graph/mappers/domain/MappingResult";
import { TypeScriptNodeSchema } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { TypeScriptEdgeSchema } from "@/libs/typescript-graph/domain/TypeScriptEdge";

describe("MappingResult utilities", () => {
  const MockDataSchema = z.object({
    generics: z.array(z.string()).default([]),
    memberNames: z
      .object({
        methods: z.array(z.string()).default([]),
      })
      .default({}),
  });

  const MockNode = TypeScriptNodeSchema(MockDataSchema).parse({
    id: "mock-node",
    name: "MockNode",
    type: "class", // Use a valid TypeScriptNodeTypes value
    scope: "internal",
    status: "resolved",
    location: {
      filePath: "/mock/path.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 20,
    },
    data: {},
  });

  const MockEdge = TypeScriptEdgeSchema().parse({
    id: "mock-edge",
    source: "mock-node",
    target: "another-mock-node",
    label: "entity uses", // Use a valid TypeScriptEdgeRelationshipValues value
  });

  describe("createEmptyMappingResult", () => {
    it("should create an empty mapping result with no data schema", () => {
      const result = createEmptyMappingResult();

      expect(result).toEqual({
        nodes: [],
        edges: [],
        data: {},
      });
    });

    it("should create an empty mapping result with a provided data schema", () => {
      const result = createEmptyMappingResult(MockDataSchema);

      expect(result).toEqual({
        nodes: [],
        edges: [],
        data: {
          generics: [],
          memberNames: { methods: [] },
        },
      });
    });
  });

  describe("createMappingResult", () => {
    it("should create a complete mapping result with provided nodes, edges, and data", () => {
      const result = createMappingResult(
        MockDataSchema,
        [MockNode],
        [MockEdge],
        {
          generics: ["T"],
          memberNames: { methods: ["calculate"] },
        }
      );

      expect(result).toEqual({
        nodes: [MockNode],
        edges: [MockEdge],
        data: {
          generics: ["T"],
          memberNames: { methods: ["calculate"] },
        },
      });
    });

    it("should default data fields when omitted", () => {
      const result = createMappingResult(
        MockDataSchema,
        [MockNode],
        [MockEdge]
      );

      expect(result).toEqual({
        nodes: [MockNode],
        edges: [MockEdge],
        data: {
          generics: [],
          memberNames: { methods: [] },
        },
      });
    });
  });

  describe("createPartialMappingResult", () => {
    it("should create a partial mapping result with provided nodes, edges, and data", () => {
      const result = createPartialMappingResult(
        MockDataSchema,
        [MockNode],
        [MockEdge],
        {
          memberNames: { methods: ["calculate"] },
        }
      );

      expect(result).toEqual({
        nodes: [MockNode],
        edges: [MockEdge],
        data: {
          generics: [],
          memberNames: { methods: ["calculate"] },
        },
      });
    });

    it("should create a partial mapping result with defaults when no nodes, edges, or data are provided", () => {
      const result = createPartialMappingResult(MockDataSchema);

      expect(result).toEqual({
        nodes: [],
        edges: [],
        data: {
          generics: [],
          memberNames: { methods: [] },
        },
      });
    });
  });
});
