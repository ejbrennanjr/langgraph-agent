import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story, StorySchema } from "../types";

import {
  moveStoryByWorfklowId,
  MoveStoryByWorkflowIdInputSchema,
} from "./moveStoryByWorkflowId";

export const moveStoryByWorkflowIdTool = tool(
  async (
    input: z.infer<typeof MoveStoryByWorkflowIdInputSchema>
  ): Promise<Story> => {
    return await moveStoryByWorfklowId(input);
  },
  {
    name: "move_story",
    description:
      "Moves a specified story to a new workflow state in Shortcut, using the story ID and workflow state ID.",
    schema: MoveStoryByWorkflowIdInputSchema,
  }
);
