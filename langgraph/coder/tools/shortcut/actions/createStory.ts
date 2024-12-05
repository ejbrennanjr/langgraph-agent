import { z } from "zod";

import { Story, StorySchema } from "../types";

// Define the input schema
export const CreateStoryInputSchema = z.object({
  name: z.string().describe("The name or title of the story."),
  description: z
    .string()
    .optional()
    .describe("The detailed description of the story."),
  teamId: z
    .string()
    .optional()
    .describe("The ID of the Team (Group) to assign the story to."),
  storyType: z
    .enum(["feature", "bug", "chore"])
    .optional()
    .default("feature")
    .describe("The type of story to create: feature, bug, or chore."),
  startingWorkflowStateId: z
    .string()
    .optional()
    .describe("The ID of the initial workflow state, such as Backlog."),
});

export async function createStory(
  input: z.infer<typeof CreateStoryInputSchema>
): Promise<Story> {
  const url = "https://api.app.shortcut.com/api/v3/stories";

  // Ensure the API key is defined
  const apiKey = process.env.SHORTCUT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SHORTCUT_API_KEY environment variable");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": apiKey,
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      group_id: input.teamId,
      story_type: input.storyType || "feature",
      workflow_state_id: input.startingWorkflowStateId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create story: ${errorText}`);
  }

  const data = await response.json();
  return StorySchema.parse(data);
}
