import { applyCommentToStoryTool } from "./shortcut/actions/applyCommentToStoryTool";
import { generateCreateStoryTool } from "./shortcut/actions/createStoryToolWithState";
import { moveStoryByWorkflowIdTool } from "./shortcut/actions/moveStoryByWorkflowIdTool";
import { moveStoryByWorkflowNameTool } from "./shortcut/actions/moveStoryByWorkflowNameTool";
import { generateGetStoriesInWorkflowNameTool } from "./shortcut/actions/getStoriesInWorkflowNameToolWithState";
import { generateGetStoriesToolWithState } from "./shortcut/actions/getStoriesToolWithState";
import { getStoryTool } from "./shortcut/actions/getStoryTool";
import { getTeamByNameTool } from "./shortcut/actions/getTeamByNameTool";
import { getTeamsTool } from "./shortcut/actions/getTeamsTool";

export function generateTools(state: {
  teamId: string;
  teamName: string;
  startingWorkflowStateId: string;
}) {
  const { teamId, teamName, startingWorkflowStateId } = state;
  const createStoryTool = generateCreateStoryTool({
    teamId,
    startingWorkflowStateId,
  });
  const getStoriesTool = generateGetStoriesToolWithState({
    teamName: teamName,
  });
  const getStoriesInWorkflowNameTool = generateGetStoriesInWorkflowNameTool({
    teamName: teamName,
  });
  // Add other tools if needed

  return [
    applyCommentToStoryTool,
    createStoryTool,
    getStoryTool,
    getStoriesTool,
    getStoriesInWorkflowNameTool,
    getTeamByNameTool,
    getTeamsTool,
    moveStoryByWorkflowIdTool,
    moveStoryByWorkflowNameTool,
  ];
}
