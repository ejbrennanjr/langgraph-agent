import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { getStories, GetStoriesInputSchema } from "./getStories";

// Create a schema omitting workflowStateName for getStoriesTool
const PartialGetStoriesInputSchema = GetStoriesInputSchema.omit({
  workflowStateName: true,
});

export const getStoriesTool = tool(
  async (
    input: z.infer<typeof PartialGetStoriesInputSchema>
  ): Promise<Story[]> => {
    // Call getStories with teamName only
    return await getStories({ teamName: input.teamName });
  },
  {
    name: "get_stories",
    description:
      "Gets all stories across all workflow states in Shortcut for the specified team.",
    schema: PartialGetStoriesInputSchema, // Only requires teamName
  }
);
