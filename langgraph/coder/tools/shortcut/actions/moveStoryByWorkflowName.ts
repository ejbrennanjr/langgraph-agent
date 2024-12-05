import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Story } from "../types";

import { getWorkflowStates } from "./getWorfklowStates";
import { moveStoryByWorfklowId } from "./moveStoryByWorkflowId";

export const MoveStoryByWorkflowNameInputSchema = z.object({
  storyId: z.number().describe("The unique ID of the story to be moved."),
  workflowStateName: z
    .string()
    .describe("The friendly name of the workflow state to move the story to."),
});

export async function moveStoryByWorkflowName(
  input: z.infer<typeof MoveStoryByWorkflowNameInputSchema>
): Promise<Story> {
  const workflowStates = await getWorkflowStates();
  console.log("workflowStates", workflowStates);
  const state = workflowStates.find(
    (s) =>
      s.name.toLowerCase().trim() ===
      input.workflowStateName.toLowerCase().trim()
  );
  console.log("state", state);
  if (!state) {
    throw new Error(`Workflow state '${input.workflowStateName}' not found.`);
  }

  return await moveStoryByWorfklowId({
    storyId: input.storyId,
    workflowStateId: state.id,
  });
}
