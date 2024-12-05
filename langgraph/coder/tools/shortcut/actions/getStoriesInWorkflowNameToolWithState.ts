import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { getStories } from "./getStories";
import { GetStoriesWithWorkflowNameInputSchema } from "./getStoriesInWorkflowNameTool";

// Create a new schema that omits groupId and workflowStateId as they are provided by state
const PartialGetStoriesInWorkflowNameInputSchema =
  GetStoriesWithWorkflowNameInputSchema.omit({
    teamName: true,
  });

export function generateGetStoriesInWorkflowNameTool(state: {
  teamName: string;
}) {
  const { teamName } = state;
  console.log("generateGetStoriesInWorkflowNameTool teamName: ", teamName);

  // NOTE: Converting the return type to a string because of this issue, should be Story[]:
  // https://github.com/langchain-ai/langgraphjs/issues/506
  const getStoriesInWorkflowNameTool = tool(
    async (
      input: z.infer<typeof PartialGetStoriesInWorkflowNameInputSchema>
    ): Promise<string> => {
      // Assert that after merging state, teamId will exist
      const completeInput: z.infer<
        typeof GetStoriesWithWorkflowNameInputSchema
      > = {
        ...input,
        teamName: teamName,
      };

      // Call the getStoriesInWorkflowName function with the complete input
      // NOTE: Converting the return type to a string because of this issue:
      // https://github.com/langchain-ai/langgraphjs/issues/506
      return JSON.stringify(await getStories(completeInput));
    },
    {
      name: "get_stories_in_workflow_name",
      description:
        "Gets all stories in a specified workflow state in Shortcut, using the workflow state name provided and deriving teamName from graph state.",
      schema: PartialGetStoriesInWorkflowNameInputSchema, // Only require user-provided fields
    }
  );

  return getStoriesInWorkflowNameTool;
}
