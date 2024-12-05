import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { getStory, GetStoryInputSchema } from "./getStory";

export const getStoryTool = tool(
  async (input: z.infer<typeof GetStoryInputSchema>): Promise<Story> => {
    return await getStory(input);
  },
  {
    name: "get_story",
    description:
      "Retrieves a story from Shortcut based on its unique story ID. The story will contain all of the details about the story, including the story ID, name, description, comments, etc...",
    schema: GetStoryInputSchema,
  }
);
