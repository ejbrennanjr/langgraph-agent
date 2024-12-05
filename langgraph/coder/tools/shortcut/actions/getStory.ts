import { z } from "zod";
import { Story, StorySchema } from "../types";

export const GetStoryInputSchema = z.object({
  storyId: z.number().describe("The unique ID of the story to retrieve."),
});

export async function getStory(
  input: z.infer<typeof GetStoryInputSchema>
): Promise<Story> {
  const url = `https://api.app.shortcut.com/api/v3/stories/${input.storyId}`;
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
    throw new Error(`Failed to retrieve story: ${errorText}`);
  }

  const data = await response.json();
  return StorySchema.parse(data); // Parse and validate the response using Zod
}
