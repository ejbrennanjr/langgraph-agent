import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Group } from "../types";
import { getTeamById, GetTeamByIdInputSchema } from "./getTeamById";

// Tool definition for getting a specific team by ID
export const getTeamByIdTool = tool(
  async (input: z.infer<typeof GetTeamByIdInputSchema>): Promise<Group> => {
    return await getTeamById(input);
  },
  {
    name: "get_team_by_id",
    description: "Gets a specific team from Shortcut by its ID.",
    schema: GetTeamByIdInputSchema,
  }
);
