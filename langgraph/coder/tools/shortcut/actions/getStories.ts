// src/tools/shortcut/actions/getStories.ts

import { z } from "zod";
import { Story, StorySchema } from "../types";

// Update the schema to make workflowStateName optional
export const GetStoriesInputSchema = z.object({
  teamName: z.string().describe("The name of the Team (Group) to filter on."),
  workflowStateName: z
    .string()
    .optional()
    .describe(
      "Optional friendly name of the workflow state to filter stories."
    ),
});

export async function getStories(
  input: z.infer<typeof GetStoriesInputSchema>
): Promise<Story[]> {
  console.log("getStories input.teamName:", input.teamName);
  console.log("getStories input.workflowStateName:", input?.workflowStateName);

  // Build the query URL with the workflowStateName filter if provided
  const workflowFilter = input.workflowStateName
    ? ` state:"${input.workflowStateName}"`
    : "";
  const url = `https://api.app.shortcut.com/api/v3/search/stories?query=team:"${input.teamName}"${workflowFilter}`;
  console.log(`url: ${url}`);

  const apiKey = process.env.SHORTCUT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SHORTCUT_API_KEY environment variable");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get stories: ${errorText}`);
  }

  const data = await response.json();

  // Filter and parse the stories to exclude archived ones and type them as Story[]
  const activeStories: Story[] = data.data
    .filter((story: Story) => story.archived === false)
    .map((story: any) => StorySchema.parse(story));

  console.log("getStories response data:", activeStories);
  return activeStories;
}
