import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { createStory, CreateStoryInputSchema } from "./createStory";

export const createStoryTool = tool(
  async (input: z.infer<typeof CreateStoryInputSchema>): Promise<Story> => {
    return await createStory(input);
  },
  {
    name: "create_story",
    description:
      "Creates a new story in Shortcut, assigning it to a specified team via Group ID, with optional details.",
    schema: CreateStoryInputSchema,
  }
);
