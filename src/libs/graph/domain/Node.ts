import { z } from "zod";

// =======================================================================================================
// SCHEMAS & TYPES
// =======================================================================================================

// Define a generic NodeSchema function
// This function takes a Zod schema as an argument and returns a new Zod schema
export const NodeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    // Every node must have an 'id' field that is a string
    id: z.string(),
    // The 'data' field uses the schema passed as an argument
    // This allows for flexible data structures in different types of nodes
    data: dataSchema,
  });

// Define the Node type
// This type is inferred from the schema returned by NodeSchema
// It's generic, allowing for different data structures
export type Node<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof NodeSchema<T>>
>;
