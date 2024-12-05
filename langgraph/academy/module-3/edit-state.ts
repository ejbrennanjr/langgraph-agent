// === Imports Section ===
// This section handles all necessary imports from various libraries used in the project.

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths.
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths.

import * as dotenv from "dotenv"; // Loads environment variables from a .env file.
import { z } from "zod"; // Zod is a TypeScript-first schema declaration and validation library.

// Imports the `tool` function from LangChain to define and register tools.
import { tool } from "@langchain/core/tools";
// Imports LangChain's ChatOpenAI module for working with OpenAI models.
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
// Imports from LangGraph for state graph management and message annotations.
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { printMessages } from "../../libs/messages"; // Import the printMessages function from the local file.

// === Setup CommonJS in ESM Section ===
// This section configures __dirname and __filename for compatibility between CommonJS and ESM environments.

const __filename = fileURLToPath(import.meta.url); // Convert the current file URL to a path.
const __dirname = dirname(__filename); // Get the directory name of the current module.

// === Environment Variable Configuration Section ===
// Load environment variables from the .env file and log them for confirmation.

dotenv.config(); // Load environment variables from .env file.
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Log API keys for confirmation (avoid doing this in production for security).
console.log(`
=================================================================
API Keys Configuration
=================================================================
OpenAI API Key:    ${OPENAI_API_KEY}
LangChain API Key: ${LANGCHAIN_API_KEY}
Tavily API Key:    ${TAVILY_API_KEY}
=================================================================
`);

// === Tool Definitions Section ===
// In this section, we define two tools: 'add', 'multiply', 'divide'. These tools use Zod for input validation and LangChain's tool function.

const addSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'add' tool that adds two numbers using the tool() function from LangChain.
const addTool = tool(
  async ({ a, b }) => {
    console.log("--- addTool ---");
    return a + b; // Perform the addition.
  },
  {
    name: "add", // Name of the tool.
    schema: addSchema, // Input validation schema.
    description: "Adds a and b.", // Description of what the tool does.
  }
);

// Define the schema for the 'multiply' tool.
const multiplySchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'multiply' tool that multiplies two numbers.
const multiplyTool = tool(
  async ({ a, b }) => {
    console.log("--- multiplyTool ---");
    return a * b; // Perform the multiplication.
  },
  {
    name: "multiply", // Name of the tool.
    schema: multiplySchema, // Input validation schema.
    description: "Multiplies a and b.", // Description of what the tool does.
  }
);

// Define the schema for the 'multiply' tool.
const divideSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'multiply' tool that divides two numbers.
const divideTool = tool(
  async ({ a, b }) => {
    console.log("--- divideTool ---");
    return a / b; // Perform the division.
  },
  {
    name: "divide", // Name of the tool.
    schema: divideSchema, // Input validation schema.
    description: "Divides a and b.", // Description of what the tool does.
  }
);

// === Tool Collection Section ===
// This section defines collections of tools that will later be used in the LLM model.

const tools = [addTool, multiplyTool, divideTool]; // Array containing all the tools.

// === LLM Initialization Section ===
// Here, we create an instance of the ChatOpenAI model and bind the tools defined above.

const llm = new ChatOpenAI({
  model: "gpt-4o-mini", // Specifies the OpenAI model being used.
  temperature: 0, // Controls the randomness of the output (0 for deterministic responses).
});

// Bind the tools to the LLM instance to allow the model to invoke these tools.
const llmWithTools = llm.bindTools(tools);

// === Graph Node Definition Section ===
// Define the node that will call the LLM with the tools. This node is part of the state graph.
const assistantNode = async (
  state: typeof MessagesAnnotation.State // Type annotation for the state.
) => {
  console.log("--- assistantNode ---"); // Log the current node.

  const systemMessage = new SystemMessage(
    "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
  );
  const combinedMessages = [systemMessage, ...state["messages"]];
  const aiMessages = await llmWithTools.invoke(combinedMessages); // Invoke the LLM with tools using the messages in the state.
  return {
    messages: [aiMessages], // Return the AI-generated messages.
  };
};

const humanFeedbackNode = async (
  state: typeof MessagesAnnotation.State // Type annotation for the state.
) => {
  console.log("--- humanFeedbackNode ---"); // Log the current node.
  return state;
};

// === Graph Building Section ===
// Build a state graph using LangGraph. Nodes represent steps in the process, and edges define transitions between nodes.

// === Graph Building Section ===
// Build a state graph using LangGraph. Nodes represent steps in the process, and edges define transitions between nodes.

const builder = new StateGraph(MessagesAnnotation)
  .addNode("assistant", assistantNode)
  .addNode("tools", new ToolNode(tools))
  .addNode("human_feedback", humanFeedbackNode)
  .addEdge(START, "human_feedback")
  .addEdge("human_feedback", "assistant")
  .addConditionalEdges("assistant", toolsCondition)
  .addEdge("tools", "human_feedback");

// Compile the graph to prepare it for execution.
const memory = new MemorySaver();
export const graph = builder.compile({
  checkpointer: memory,
  interruptBefore: ["human_feedback"],
});

// === Main Function Section ===
// This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

const main = async function () {
  console.log("Running in standalone mode..."); // Log that the main function is running.
  console.log("\n\nRunning in streaming VALUES mode...");
  const config = {
    configurable: {
      thread_id: "8",
    },
    streamMode: "values" as const,
  };

  const intialInput = {
    messages: [new HumanMessage("Multipy 2 and 3.")],
  };

  // Use for-await-of to handle streaming in TypeScript
  for await (const chunk of await graph.stream(intialInput, config)) {
    console.log(chunk);
    console.log("\n====\n");
  }

  // Show that the current state has been interrupted before the 'tools' node.
  const currentState = await graph.getState(config);
  console.log(currentState.next);

  const userInput = "No, actually multiply by 3 and 3";

  // Update the state with a new message to correct the assistant before continuing
  await graph.updateState(config, {
    messages: [new HumanMessage(userInput)],
    as_node: "human_feedback",
  });

  // Show the messages in the state after the update
  const updatedState = await graph.getState(config);
  console.log(updatedState.values);

  // Now resume the graph execution from the interrupted state, by passing null
  for await (const chunk of await graph.stream(null, config)) {
    console.log(chunk);
    console.log("\n====\n");
  }

  // You get stopped again at the assistant, so run again

  for await (const chunk of await graph.stream(null, config)) {
    console.log(chunk);
    console.log("\n====\n");
  }
};

// === Script Execution Section ===
// Conditionally run `main()` only when the script is executed directly (not imported into another module).

if (process.argv[1].endsWith("edit-state.ts")) {
  main(); // Run the main function if the file is executed directly.
}
