import { z } from "zod";
import { Group, GroupSchema } from "../types";

// Function to get all teams (groups) from Shortcut
export async function getTeams(): Promise<Group[]> {
  const url = `https://api.app.shortcut.com/api/v3/groups`;

  // Ensure the API key is defined
  const apiKey = process.env.SHORTCUT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SHORTCUT_API_KEY environment variable");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get teams: ${errorText}`);
  }

  const data = await response.json();
  return z.array(GroupSchema).parse(data);
}
