import { z } from "zod";
import { NodeSchema } from "@/libs/graph/domain/Node";

describe("NodeSchema", () => {
  it("should create a valid node schema with a simple data structure", () => {
    // Define a basic schema for testing
    const TestDataSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    // Create a node schema using the test data schema
    const schema = NodeSchema(TestDataSchema);

    // Valid input that matches the schema
    const validNode = {
      id: "123",
      data: {
        name: "Alice",
        age: 30,
      },
    };

    expect(schema.parse(validNode)).toEqual(validNode);
  });

  it("should fail if id is missing", () => {
    const TestDataSchema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const schema = NodeSchema(TestDataSchema);

    // Missing 'id' field
    const invalidNode = {
      data: {
        name: "Alice",
        age: 30,
      },
    };

    expect(() => schema.parse(invalidNode)).toThrowError();
  });

  it("should fail if data does not match provided schema", () => {
    const TestDataSchema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const schema = NodeSchema(TestDataSchema);

    // Data does not match TestDataSchema
    const invalidNode = {
      id: "123",
      data: {
        name: "Alice",
        age: "not-a-number",
      },
    };

    expect(() => schema.parse(invalidNode)).toThrowError();
  });

  it("should allow flexible schemas with different data structures", () => {
    // Define a schema with a different structure
    const ProductDataSchema = z.object({
      productName: z.string(),
      price: z.number(),
      inStock: z.boolean(),
    });

    // Create a node schema with ProductDataSchema
    const schema = NodeSchema(ProductDataSchema);

    const validProductNode = {
      id: "456",
      data: {
        productName: "Laptop",
        price: 1500,
        inStock: true,
      },
    };

    expect(schema.parse(validProductNode)).toEqual(validProductNode);
  });

  it("should allow nested data schemas", () => {
    // Define a more complex schema with nested objects
    const NestedDataSchema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
      settings: z.object({
        theme: z.string(),
        notificationsEnabled: z.boolean(),
      }),
    });

    const schema = NodeSchema(NestedDataSchema);

    const validNestedNode = {
      id: "789",
      data: {
        user: {
          name: "Bob",
          age: 45,
        },
        settings: {
          theme: "dark",
          notificationsEnabled: true,
        },
      },
    };

    expect(schema.parse(validNestedNode)).toEqual(validNestedNode);
  });
});
