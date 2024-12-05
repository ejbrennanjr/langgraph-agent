import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { getStories } from "./getStories";

export const GetStoriesWithWorkflowNameInputSchema = z.object({
  teamName: z.string().describe("The name of the Team (Group) to filter on."),
  workflowStateName: z
    .string()
    .describe("The friendly name of the workflow state to get stories from."),
});

export const getStoriesInWorkflowNameTool = tool(
  async (
    input: z.infer<typeof GetStoriesWithWorkflowNameInputSchema>
  ): Promise<Story[]> => {
    return await getStories(input);
  },
  {
    name: "get_stories_in_workflow_name",
    description:
      "Gets all stories in a specified workflow state in Shortcut, using the workflow state name and the team name derived from state.",
    schema: GetStoriesWithWorkflowNameInputSchema,
  }
);
