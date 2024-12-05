import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Comment } from "../types";
import {
  applyCommentToStory,
  ApplyCommentToStoryInputSchema,
} from "./applyCommentToStory";

// Tool definition for applying a comment
export const applyCommentToStoryTool = tool(
  async (
    input: z.infer<typeof ApplyCommentToStoryInputSchema>
  ): Promise<Comment> => {
    return await applyCommentToStory(input);
  },
  {
    name: "apply_comment",
    description:
      "Applies a comment to a specified story in Shortcut, using the story ID. This is only used to add a comment to the story. It is not used to update a comment. It is not used to retrieve comments.",
    schema: ApplyCommentToStoryInputSchema,
  }
);
