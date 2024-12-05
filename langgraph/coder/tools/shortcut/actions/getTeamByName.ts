import { z } from "zod";
import { Group } from "../types";
import { getTeams } from "./getTeams";

// Define the input schema for getting a specific team by name
export const GetTeamByNameInputSchema = z.object({
  teamName: z.string().describe("The name of the team to retrieve."),
});

// Function to get a specific team by name
export async function getTeamByName(
  input: z.infer<typeof GetTeamByNameInputSchema>
): Promise<Group> {
  const teams = await getTeams();
  const team = teams.find(
    (t) => t.name.toLowerCase().trim() === input.teamName.toLowerCase().trim()
  );

  if (!team) {
    throw new Error(`Team with name '${input.teamName}' not found.`);
  }

  return team;
}
