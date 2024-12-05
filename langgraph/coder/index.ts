import {
  LANGCHAIN_API_KEY,
  OPENAI_API_KEY,
  SHORTCUT_API_KEY,
  TAVILY_API_KEY,
} from "../config";

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import { z } from "zod";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  NodeInterrupt,
  Send,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import { generateTools } from "./tools/generateTools";

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
// Configure the OpenAI Chat API
// ==================================================================================================================================
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// ==================================================================================================================================
// Define the state graph for the Shortcut Agent
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
});

// ==================================================================================================================================
// Define the nodes & edges of our Shortcut Agent graph
// ==================================================================================================================================

const agentNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- agentNode ---");
  const {
    messages,
    teamId,
    teamName,
    startingWorkflowStateId,
    startingWorkflowStateName,
  } = state;
  console.log("agentNode teamId", teamId);
  console.log("agentNode teamName", teamName);
  console.log("agentNode startingWorkflowStateId", startingWorkflowStateId);
  console.log("agentNode startingWorkflowStateName", startingWorkflowStateName);
  const tools = generateTools({
    teamId,
    teamName,
    startingWorkflowStateId,
  });
  const llmWithTools = llm.bindTools(tools);
  const systemMessage = {
    role: "system",
    content: `
    You are the Project Manager for the software engineering team, managing our kanban board in Shortcut.
    You will receive instructions from a Product Manager to guide your actions. Your tasks are to:
    Move Tasks: Move tasks through the board as they progress, from Backlog to Done.
    Update Status: Ensure the board reflects the current status of each task, moving them to the next column when appropriate.
    Communicate: Notify team members if a task needs their attention in the next phase.
    Your goal is to keep the board up-to-date and ensure tasks flow smoothly based on Product Manager instructions.`,
  };

  const result = await llmWithTools.invoke([systemMessage, ...messages]);
  return { messages: [result] };
};

const toolNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- toolNode ---");
  const { messages, teamId, teamName, startingWorkflowStateId } = state;

  const tools = generateTools({ teamId, teamName, startingWorkflowStateId });
  const toolNodeInstance = new ToolNode(tools);

  console.log("before invoke, messages", messages);
  const result = await toolNodeInstance.invoke(state);
  console.log("after invoke, messages", state.messages);

  return result;
};

const routeMessage = (state: typeof GraphAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage?.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

// ==================================================================================================================================
// Define the workflow of our graph
// ==================================================================================================================================
const workflow = new StateGraph(GraphAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent")
  .addEdge("agent", END);

export const graph = workflow.compile({
  // checkpointer: new MemorySaver(),
});

graph.invoke({
  groupId: "66e60f92-ccd0-4330-8288-5463eae8ef94",
  workflowStateId: "500000006",
});

// ==================================================================================================================================
// Running the program
// ==================================================================================================================================
async function main() {
  console.log("Running in standalone mode...");

  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };

  for await (const chunk of await graph.stream(
    {
      messages: [
        new HumanMessage(
          "Add a story to the backlog to refactor the HomePage component to support i18n."
        ),
      ],
    },
    config
  )) {
    console.log(chunk);
  }
}

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("index.ts")) {
  main();
}
