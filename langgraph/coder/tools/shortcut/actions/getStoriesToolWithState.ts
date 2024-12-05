import { tool } from "@langchain/core/tools";
import { Story } from "../types";
import { getStories, GetStoriesInputSchema } from "./getStories";

// Create a schema that requires only teamName from the state and nothing else
const PartialGetStoriesInputSchema = GetStoriesInputSchema.omit({
  teamName: true,
  workflowStateName: true,
});

// NOTE: Converting the return type to a string because of this issue, should be Story[]:
// https://github.com/langchain-ai/langgraphjs/issues/506
export function generateGetStoriesToolWithState(state: { teamName: string }) {
  const { teamName } = state;
  console.log("generateGetStoriesToolWithState teamName:", teamName);

  const getStoriesTool = tool(
    async (): Promise<string> => {
      // Call getStories with teamName only
      // NOTE: Converting the return type to a string because of this issue, should be Story[]:
      // https://github.com/langchain-ai/langgraphjs/issues/506
      return JSON.stringify(await getStories({ teamName }));
    },
    {
      name: "get_stories",
      description:
        "Gets all stories across all workflow states in Shortcut for the specified team, using the teamName from the graph state.",
      schema: PartialGetStoriesInputSchema,
    }
  );

  return getStoriesTool;
}
