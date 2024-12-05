import { z } from "zod";
import { Comment } from "../types";

// Define the input schema for applying a comment to a story
export const ApplyCommentToStoryInputSchema = z.object({
  storyId: z
    .number()
    .describe("The unique ID of the story to apply the comment to."),
  text: z.string().min(1).describe("The text of the comment to be applied."),
});

// Function to apply a comment to a story
export async function applyCommentToStory(
  input: z.infer<typeof ApplyCommentToStoryInputSchema>
): Promise<Comment> {
  const url = `https://api.app.shortcut.com/api/v3/stories/${input.storyId}/comments`;

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
      text: input.text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to apply comment: ${errorText}`);
  }

  const data = await response.json();
  return data;
}
