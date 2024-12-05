import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { createStory, CreateStoryInputSchema } from "./createStory";

// Create a new schema that omits groupId and workflowStateId as they are provided by state
const PartialCreateStoryInputSchema = CreateStoryInputSchema.omit({
  teamId: true,
  startingWorkflowStateId: true,
});

export function generateCreateStoryTool(state: {
  teamId: string;
  startingWorkflowStateId: string;
}) {
  const { teamId, startingWorkflowStateId } = state;

  const createStoryTool = tool(
    async (
      input: z.infer<typeof PartialCreateStoryInputSchema>
    ): Promise<Story> => {
      // Assert that after merging state, groupId and workflowStateId will exist
      const completeInput: z.infer<typeof CreateStoryInputSchema> = {
        ...input,
        teamId: teamId,
        startingWorkflowStateId: startingWorkflowStateId,
      };

      // Call the createStory function with the complete input
      return await createStory(completeInput);
    },
    {
      name: "create_story",
      description:
        "Creates a new story in Shortcut, using saved team and starting workflow state IDs from the state if available.",
      schema: PartialCreateStoryInputSchema, // Only require user-provided fields
    }
  );

  return createStoryTool;
}
