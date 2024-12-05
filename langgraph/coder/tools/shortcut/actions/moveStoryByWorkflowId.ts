import { z } from "zod";
import { Story, StorySchema } from "../types";

// Define the input schema for moving a story in the workflow
export const MoveStoryByWorkflowIdInputSchema = z.object({
  storyId: z.number().describe("The unique ID of the story to be moved."),
  workflowStateId: z
    .number()
    .describe("The ID of the new workflow state to move the story to."),
});

// Function to move a story to a new workflow state
export async function moveStoryByWorfklowId(
  input: z.infer<typeof MoveStoryByWorkflowIdInputSchema>
): Promise<Story> {
  const url = `https://api.app.shortcut.com/api/v3/stories/${input.storyId}`;

  // Ensure the API key is defined
  const apiKey = process.env.SHORTCUT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SHORTCUT_API_KEY environment variable");
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": apiKey,
    },
    body: JSON.stringify({
      workflow_state_id: input.workflowStateId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to move story: ${errorText}`);
  }

  const data = await response.json();
  return StorySchema.parse(data);
}
