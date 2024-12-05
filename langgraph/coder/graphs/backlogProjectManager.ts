import {
  LANGCHAIN_API_KEY,
  OPENAI_API_KEY,
  SHORTCUT_API_KEY,
  TAVILY_API_KEY,
} from "../../config";

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import { dirname } from "path"; // Provides utilities for working with file and directory paths

import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";

import { applyCommentToStory } from "../tools/shortcut/actions/applyCommentToStory";
import { getStories } from "../tools/shortcut/actions/getStories";
import { moveStoryByWorkflowName } from "../tools/shortcut/actions/moveStoryByWorkflowName";

// Define the path for __dirname and __filename (CommonJS support in ESM environments)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log API keys for confirmation (do not log sensitive data in production!)
console.log(`
  =================================================================
  API Keys Configuration
  =================================================================
  OpenAI API Key:    ${OPENAI_API_KEY}
  LangChain API Key: ${LANGCHAIN_API_KEY}
  Shortcut API Key:  ${SHORTCUT_API_KEY}
  Tavily API Key:    ${TAVILY_API_KEY}
  =================================================================
  `);

// ==================================================================================================================================
// Define the state graph for the Backlog Project Manager
// ==================================================================================================================================
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  teamId: Annotation<string>({
    reducer: (prev, next) => next, // Defines how updates are processed
    default: () => process.env.SHORTCUT_TEAM_ID || "", // Initial default value
  }),
  teamName: Annotation<string>({
    reducer: (prev, next) => next, // Defines how updates are processed
    default: () => process.env.SHORTCUT_TEAM_NAME || "", // Initial default value
  }),
  startingWorkflowStateId: Annotation<string>({
    reducer: (prev, next) => next, // Defines how updates are processed
    default: () => process.env.SHORTCUT_STARTING_WORKFLOW_ID || "", // Initial default value
  }),
  startingWorkflowStateName: Annotation<string>({
    reducer: (prev, next) => next, // Defines how updates are processed
    default: () => process.env.SHORTCUT_STARTING_WORKFLOW_NAME || "", // Initial default value
  }),
  backlogStories: Annotation<Array<{ id: number; title: string }>>({
    reducer: (prev, next) => next,
    default: () => [],
  }),
  toDoStories: Annotation<Array<{ id: number; title: string }>>({
    reducer: (prev, next) => next,
    default: () => [],
  }),
  activeStoryId: Annotation<number | null>({
    reducer: (prev, next) => next,
    default: () => null,
  }),
});

// ==================================================================================================================================
// Define the nodes & edges of our Backlog Project Manager graph
// ==================================================================================================================================

const watcherNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- watcherNode ---");
  const { teamName } = state;

  // Fetch the latest backlog and To Do stories
  const backlogStories = await getStories({
    teamName,
    workflowStateName: "Backlog",
  });

  const toDoStories = await getStories({
    teamName,
    workflowStateName: "To Do",
  });

  // Return the updated state with refreshed stories
  return {
    backlogStories,
    toDoStories,
  };
};

function shouldContinueEdge(state: typeof GraphAnnotation.State) {
  console.log("--- shouldContinueEdge ---");
  const { backlogStories, toDoStories } = state;

  console.log("shouldContinueEdge backlogStories", backlogStories.length);
  console.log("shouldContinueEdgetoDoStories", toDoStories.length);
  // Check if there are backlog stories and the To Do column is empty
  if (backlogStories.length > 0 && toDoStories.length === 0) {
    return "moveStory";
  }

  // Otherwise, end the workflow
  return END;
}

const moveStoryNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- moveStoryNode ---");
  const { teamName, backlogStories } = state;
  const firstBacklogStory = backlogStories[0];

  if (!firstBacklogStory) {
    throw new Error("No stories available in the backlog to move.");
  }

  // Attempt to move the story to the "To Do" column
  try {
    await moveStoryByWorkflowName({
      storyId: firstBacklogStory.id,
      workflowStateName: "To Do",
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to move story ID ${firstBacklogStory.id}: ${error.message}`
      );
    } else {
      throw new Error(
        `Failed to move story ID ${firstBacklogStory.id}: Unknown error occurred.`
      );
    }
  }

  // Fetch the latest backlog stories
  let updatedBacklogStories;
  try {
    updatedBacklogStories = await getStories({
      teamName,
      workflowStateName: "Backlog",
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to refresh backlog stories: ${error.message}`);
    } else {
      throw new Error(
        "Failed to refresh backlog stories: Unknown error occurred."
      );
    }
  }

  // Fetch the latest To Do stories
  let updatedToDoStories;
  try {
    updatedToDoStories = await getStories({
      teamName,
      workflowStateName: "To Do",
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to refresh To Do stories: ${error.message}`);
    } else {
      throw new Error(
        "Failed to refresh To Do stories: Unknown error occurred."
      );
    }
  }

  // Return the updated state with the activeStoryId and refreshed stories
  return {
    activeStoryId: firstBacklogStory.id,
    backlogStories: updatedBacklogStories,
    toDoStories: updatedToDoStories,
  };
};

const commentNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- commentNode ---");
  const { activeStoryId } = state;

  if (!activeStoryId) {
    throw new Error("No active story ID found to apply the comment to.");
  }

  try {
    // Apply a comment to the active story
    await applyCommentToStory({
      storyId: activeStoryId,
      text: "This story is now ready to be worked on.",
    });

    console.log(`Comment applied to story ID ${activeStoryId}.`);

    // Return the updated state with activeStoryId cleared
    return {
      activeStoryId: null, // Clear the active story ID after the comment is applied
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to apply comment to story ID ${activeStoryId}: ${error.message}`
      );
    } else {
      throw new Error(
        `Failed to apply comment to story ID ${activeStoryId}: Unknown error occurred.`
      );
    }
  }
};

// ==================================================================================================================================
// Graph Helper Functions
// ==================================================================================================================================

// ==================================================================================================================================
// Define the workflow of our graph
// ==================================================================================================================================
const workflow = new StateGraph(GraphAnnotation)
  .addNode("watcher", watcherNode)
  .addNode("moveStory", moveStoryNode)
  .addNode("comment", commentNode)
  .addEdge(START, "watcher")
  .addConditionalEdges("watcher", shouldContinueEdge)
  .addEdge("moveStory", "comment")
  .addEdge("comment", END);

export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});

// ==================================================================================================================================
// Running the program
// ==================================================================================================================================
async function main() {
  console.log("Running Backlog Project Manager...");
  console.log("\n\nRunning in streaming VALUES mode...");

  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };
  const initialState = {
    teamId: process.env.SHORTCUT_TEAM_ID,
    teamName: process.env.SHORTCUT_TEAM_NAME,
  };
  // Use for-await-of to handle streaming in TypeScript
  for await (const chunk of await graph.stream(initialState, config)) {
    console.log(chunk);
    console.log("\n====\n");
  }
}

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("backlogProjectManager.ts")) {
  main();
}
