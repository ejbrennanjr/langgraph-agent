// === Imports Section ===
// Import necessary libraries to handle file paths, environment variables, schemas, and tools.
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import * as dotenv from "dotenv";
import { z } from "zod"; // Schema validation library.
import { tool } from "@langchain/core/tools"; // LangChain's tool function.
import { ChatOpenAI } from "@langchain/openai"; // OpenAI's chat model.
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages"; // Message classes from LangChain.
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph"; // LangGraph classes for state management.
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt"; // Pre-built tool nodes for LangGraph.

// === Setup CommonJS in ESM Section ===
// Configure file paths for compatibility with ESM environments.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === Environment Variable Configuration Section ===
// Load and configure environment variables, typically sensitive information.
dotenv.config();
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Log the API keys for validation (note: do not do this in production for security reasons).
console.log(`
=================================================================
Environment Variables Loaded
=================================================================
OpenAI API Key:    ${OPENAI_API_KEY}
LangChain API Key: ${LANGCHAIN_API_KEY}
Tavily API Key:    ${TAVILY_API_KEY}
=================================================================
`);

// === Tool Definitions Section ===
// Define tools using LangChain's tool() function and validate inputs with Zod schemas.

const addSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// The 'add' tool adds two numbers together.
const addTool = tool(
  async ({ a, b }) => {
    console.log("--- [Tool] Add Tool Invoked ---");
    return a + b;
  },
  {
    name: "add",
    schema: addSchema,
    description: "Adds two numbers (a + b).",
  }
);

const multiplySchema = z.object({
  a: z.number(),
  b: z.number(),
});

// The 'multiply' tool multiplies two numbers.
const multiplyTool = tool(
  async ({ a, b }) => {
    console.log("--- [Tool] Multiply Tool Invoked ---");
    return a * b;
  },
  {
    name: "multiply",
    schema: multiplySchema,
    description: "Multiplies two numbers (a * b).",
  }
);

const divideSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// The 'divide' tool divides two numbers.
const divideTool = tool(
  async ({ a, b }) => {
    console.log("--- [Tool] Divide Tool Invoked ---");
    return a / b;
  },
  {
    name: "divide",
    schema: divideSchema,
    description: "Divides two numbers (a / b).",
  }
);

// === Tool Collection Section ===
// Group the defined tools into an array for easy reference and use.
const tools = [addTool, multiplyTool, divideTool];

// === LLM Initialization Section ===
// Initialize the LLM (OpenAI's GPT-4 model in this case) and bind the tools to it.
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0, // Deterministic responses.
});
const llmWithTools = llm.bindTools(tools);

// === Graph Node Definition Section ===
// Define the assistant node that processes messages and uses the tools.
const assistantNode = async (state: typeof MessagesAnnotation.State) => {
  console.log("--- [Graph Node] Assistant Node Invoked ---");

  const systemMessage = new SystemMessage(
    "You are a helpful assistant tasked with performing arithmetic operations."
  );
  const combinedMessages = [systemMessage, ...state["messages"]];

  // Invoke the LLM to process the messages and tools.
  const aiMessages = await llmWithTools.invoke(combinedMessages);
  return {
    messages: [aiMessages],
  };
};

// === Graph Building Section ===
// Build a state graph using LangGraph. This defines the workflow of nodes and their transitions.
const builder = new StateGraph(MessagesAnnotation)
  .addNode("assistant", assistantNode) // Add the assistant node.
  .addNode("tools", new ToolNode(tools)) // Add a tool node to handle tool calls.
  .addEdge(START, "assistant") // Define the flow from START to the assistant node.
  .addConditionalEdges("assistant", toolsCondition) // Conditionally move to tools node based on state.
  .addEdge("tools", "assistant"); // Return to assistant after tool use.

// Compile the graph to prepare it for execution.
const memory = new MemorySaver();
export const graph = builder.compile({
  checkpointer: memory,
});

// === Main Function Section ===
// The main function that triggers the graph execution in standalone mode.
const main = async function () {
  console.log("\n\nRunning the graph in standalone mode...");
  const config = {
    configurable: {
      thread_id: "8", // Define a thread ID for state persistence.
    },
    streamMode: "values" as const, // Enable streaming of values.
  };

  // Define the initial input message to the assistant.
  const intialInput = {
    messages: [new HumanMessage("Multiply 2 and 3.")],
  };

  // Stream the results from the graph execution and log each chunk of output.
  for await (const chunk of await graph.stream(intialInput, config)) {
    console.log("--- [Stream Output] Chunk ---");
    console.log(chunk);
    console.log("\n====\n");
  }

  // Log the final state of the graph.
  console.log("--- [Final State] ---");
  console.log(await graph.getState(config));

  // Collect and log the entire state history.
  const allStates: any[] = [];
  const stateHistory = graph.getStateHistory(config);
  for await (const state of stateHistory) {
    allStates.push(state);
  }

  console.log("--- [State History Length] ---");
  console.log(allStates.length);

  // Log the second state and its next state.
  console.log("--- [State 2 Next] ---");
  console.log(allStates[1].next);

  const toFork = allStates[allStates.length - 2]; // Get the state to fork from.
  console.log("--- [Forking State] ---");
  console.log(toFork);
  console.log(toFork.values.messages[0].id);

  // Update the state with new input and fork the graph.
  const fork_config = await graph.updateState(toFork.config, {
    messages: [
      new HumanMessage({
        content: "Multiply 5 and 3",
        id: toFork.values.messages[0].id,
      }),
    ],
  });

  console.log("--- [Fork Config] ---");
  console.log(fork_config);

  console.log("--- [Updated Final State] ---");
  console.log(await graph.getState(config));

  // Replay the graph from the forked state.
  for await (const chunk of await graph.stream(null, {
    ...fork_config,
    streamMode: "values",
  })) {
    console.log("--- [Stream Replay] Chunk ---");
    console.log(chunk);
    console.log("\n====\n");
  }
};

// === Script Execution Section ===
// Only run `main()` if the script is executed directly.
if (process.argv[1].endsWith("time-travel-fork.ts")) {
  main();
}
