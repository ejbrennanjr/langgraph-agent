import { EdgeSchema } from "@/libs/graph/domain/Edge";

describe("EdgeSchema", () => {
  describe("basic validation", () => {
    it("should validate an edge with minimal required fields", () => {
      const schema = EdgeSchema();
      const validEdge = {
        id: "edge1",
        source: "node1",
        target: "node2",
      };

      expect(schema.parse(validEdge)).toEqual(validEdge);
    });

    it("should validate an edge with a label", () => {
      const schema = EdgeSchema();
      const validEdgeWithLabel = {
        id: "edge2",
        source: "node1",
        target: "node2",
        label: "link",
      };

      expect(schema.parse(validEdgeWithLabel)).toEqual(validEdgeWithLabel);
    });

    it("should reject additional top-level fields", () => {
      const schema = EdgeSchema();
      const invalidEdge = {
        id: "edge1",
        source: "node1",
        target: "node2",
        label: "link",
        extraField: "should not be here",
      };

      expect(() => schema.parse(invalidEdge)).toThrow(
        "Unrecognized key(s) in object: 'extraField'"
      );
    });
  });

  describe("required fields validation", () => {
    const schema = EdgeSchema();

    it.each([
      {
        omit: "id",
        edge: {
          source: "node1",
          target: "node2",
          label: "link",
        },
      },
      {
        omit: "source",
        edge: {
          id: "edge1",
          target: "node2",
          label: "link",
        },
      },
      {
        omit: "target",
        edge: {
          id: "edge1",
          source: "node1",
          label: "link",
        },
      },
    ])("should require $omit field", ({ edge }) => {
      expect(() => schema.parse(edge)).toThrow();
    });
  });

  describe("non-empty fields validation", () => {
    const schema = EdgeSchema();

    it.each([
      {
        field: "id",
        edge: { id: "", source: "node1", target: "node2" },
      },
      {
        field: "source",
        edge: { id: "edge1", source: "", target: "node2" },
      },
      {
        field: "target",
        edge: { id: "edge1", source: "node1", target: "" },
      },
    ])("should reject empty $field field", ({ edge }) => {
      expect(() => schema.parse(edge)).toThrow(/cannot be empty/);
    });
  });

  describe("label flexibility", () => {
    it("should allow edges without a label", () => {
      const schema = EdgeSchema();
      const edgeWithoutLabel = {
        id: "edge1",
        source: "node1",
        target: "node2",
      };

      expect(schema.parse(edgeWithoutLabel)).toEqual(edgeWithoutLabel);
    });

    it("should validate an edge with an optional label", () => {
      const schema = EdgeSchema();
      const edgeWithLabel = {
        id: "edge1",
        source: "node1",
        target: "node2",
        label: "optional label",
      };

      expect(schema.parse(edgeWithLabel)).toEqual(edgeWithLabel);
    });
  });
});
