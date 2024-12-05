import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Group } from "../types";
import { getTeams } from "./getTeams";
// Tool definition for getting Shortcut teams
// NOTE: Converting the return type to a string because of this issue, should be Group[]:
// https://github.com/langchain-ai/langgraphjs/issues/506
export const getTeamsTool = tool(
  async (): Promise<string> => {
    return JSON.stringify(await getTeams());
  },
  {
    name: "get_teams",
    description: "Gets all teams from Shortcut.",
    schema: z.void(),
  }
);
