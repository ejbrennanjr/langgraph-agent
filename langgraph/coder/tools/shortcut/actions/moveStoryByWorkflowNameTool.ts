import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story, StorySchema } from "../types";

import {
  moveStoryByWorkflowName,
  MoveStoryByWorkflowNameInputSchema,
} from "./moveStoryByWorkflowName";

export const moveStoryByWorkflowNameTool = tool(
  async (
    input: z.infer<typeof MoveStoryByWorkflowNameInputSchema>
  ): Promise<Story> => {
    return await moveStoryByWorkflowName(input);
  },
  {
    name: "move_story_by_workflow_name",
    description:
      "Moves a specified story to a new workflow state in Shortcut, using the story ID and a friendly workflow state name.",
    schema: MoveStoryByWorkflowNameInputSchema,
  }
);
