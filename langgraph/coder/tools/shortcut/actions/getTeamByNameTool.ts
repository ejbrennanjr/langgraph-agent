import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Group } from "../types";
import { getTeamByName, GetTeamByNameInputSchema } from "./getTeamByName";

// Tool definition for getting a specific team by name
export const getTeamByNameTool = tool(
  async (input: z.infer<typeof GetTeamByNameInputSchema>): Promise<Group> => {
    return await getTeamByName(input);
  },
  {
    name: "get_team_by_name",
    description: "Gets a specific team from Shortcut by its name.",
    schema: GetTeamByNameInputSchema,
  }
);
