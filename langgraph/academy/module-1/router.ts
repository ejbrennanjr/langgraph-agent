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
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
// Imports from LangGraph for state graph management and message annotations.
import {
  END,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

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
// In this section, we define two tools: 'add' and 'multiply'. These tools use Zod for input validation and LangChain's tool function.

const addSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'add' tool that adds two numbers using the tool() function from LangChain.
const addTool = tool(
  async ({ a, b }) => {
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
    return a * b; // Perform the multiplication.
  },
  {
    name: "multiply", // Name of the tool.
    schema: multiplySchema, // Input validation schema.
    description: "Multiplies a and b.", // Description of what the tool does.
  }
);

// === Tool Collection Section ===
// This section defines collections of tools that will later be used in the LLM model.

const tools = [addTool, multiplyTool]; // Array containing all the tools.

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

const tool_calling_llm_node = async (
  state: typeof MessagesAnnotation.State // Type annotation for the state.
) => {
  console.log("--- tool_calling_llm_node ---"); // Log the current node.
  const aiMessages = await llmWithTools.invoke(state.messages as BaseMessage[]); // Invoke the LLM with tools using the messages in the state.
  return {
    messages: [aiMessages], // Return the AI-generated messages.
  };
};

// === Graph Building Section ===
// Build a state graph using LangGraph. Nodes represent steps in the process, and edges define transitions between nodes.

const builder = new StateGraph(MessagesAnnotation)
  .addNode("tool_calling_llm_node", tool_calling_llm_node) // Add the tool calling node.
  .addNode("tools", new ToolNode(tools)) // Add the tool calling node.
  .addEdge(START, "tool_calling_llm_node") // Define the flow from the start to the tool node.
  .addConditionalEdges("tool_calling_llm_node", toolsCondition) // Define the flow from the tool node to the tool node.
  .addEdge("tools", END); // Define the flow from the tool node to the end.

// Compile the graph to prepare it for execution.
export const graph = builder.compile();

// // === Main Function Section ===
// // This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

// const main = async function () {
//   console.log("Running in standalone mode..."); // Log that the main function is running.

//   // First invocation: Simulate a conversation with a human message.
//   const stateFromHelloCall = await graph.invoke({
//     messages: new HumanMessage("Hi, this is Lance!"), // Provide an initial human message.
//   });
//   console.log(stateFromHelloCall); // Log the response from the LLM.

//   // Second invocation: Ask the LLM to solve a multiplication problem.
//   const stateFromMultipyCall = await graph.invoke({
//     messages: new HumanMessage("What is 3 multiplied by 4?"), // Provide a math-related message.
//   });
//   console.log(stateFromMultipyCall); // Log the response from the LLM.
// };

// // === Script Execution Section ===
// // Conditionally run `main()` only when the script is executed directly (not imported into another module).

// if (process.argv[1].endsWith("router.ts")) {
//   main(); // Run the main function if the file is executed directly.
// }
