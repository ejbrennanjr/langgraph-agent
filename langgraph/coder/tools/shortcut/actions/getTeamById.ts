import { z } from "zod";
import { Group } from "../types";
import { getTeams } from "./getTeams";

// Define the input schema for getting a specific team by ID
export const GetTeamByIdInputSchema = z.object({
  id: z.string().uuid().describe("The unique ID of the team to retrieve."),
});

// Function to get a specific team by ID
export async function getTeamById(
  input: z.infer<typeof GetTeamByIdInputSchema>
): Promise<Group> {
  const teams = await getTeams();
  const team = teams.find((t) => t.id === input.id);

  if (!team) {
    throw new Error(`Team with ID '${input.id}' not found.`);
  }

  return team;
}
