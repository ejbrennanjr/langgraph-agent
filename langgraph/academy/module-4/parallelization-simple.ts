import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { Annotation, END, StateGraph, START } from "@langchain/langgraph"; // Core imports from LangGraph for creating graph-based workflows

// Define the path for __dirname and __filename (CommonJS support in ESM environments)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Log API keys for confirmation (do not log sensitive data in production!)
console.log(`
=================================================================
API Keys Configuration
=================================================================
OpenAI API Key:    ${OPENAI_API_KEY}
LangChain API Key: ${LANGCHAIN_API_KEY}
Tavily API Key:    ${TAVILY_API_KEY}
=================================================================
`);

// Define the graph's state using `Annotation.Root`. This sets up a "channel" in LangGraph's terminology.
// Channels are fields of the state and can have default values and reducers. Here, we define `graphState` as a string channel.
const GraphState = Annotation.Root({
  graphState: Annotation<string>, // This is our state channel for tracking the graph's state.
});

// Define `node_1`, a function that modifies the `graphState`
const node_1 = (state: typeof GraphState.State) => {
  console.log("--- Node 1 ---");
  return {
    graphState: `${state.graphState} I'm node-1!`,
  };
};

// Define `node_2`, a function that modifies the `graphState`
const node_2 = (state: typeof GraphState.State) => {
  console.log("--- Node 2 ---");
  return {
    graphState: `${state.graphState} I'm node-2!`,
  };
};

// Define `node_3`, a function that modifies the `graphState`
const node_3 = (state: typeof GraphState.State) => {
  console.log("--- Node 3 ---");
  return {
    graphState: `${state.graphState} I'm node-3!`,
  };
};

// Define `node_4`, a function that modifies the `graphState`
const node_4 = (state: typeof GraphState.State) => {
  console.log("--- Node 4 ---");
  return {
    graphState: `${state.graphState} I'm node-4!`,
  };
};

// Build the graph using `StateGraph`. This defines the overall structure of the stateful graph.
// Nodes and edges define the execution flow and state transitions.
const builder = new StateGraph(GraphState)
  .addNode("node_1", node_1) // Add node_1 to the graph
  .addNode("node_2", node_2) // Add node_2 to the graph
  .addNode("node_3", node_3) // Add node_3 to the graph
  .addNode("node_4", node_4) // Add node_4 to the graph
  .addEdge(START, "node_1") // The graph starts execution from `node_1`
  .addEdge("node_1", "node_2")
  .addEdge("node_2", "node_3")
  .addEdge("node_3", "node_4")
  .addEdge("node_4", END); // The graph ends execution at `END`

// Export the compiled graph, which performs checks and prepares it for execution
export const graph = builder.compile();

// Main function to run the graph standalone
const main = async function () {
  console.log("Running in standalone mode...");
  const finalState = await graph.invoke({ graphState: "Hi, this is Ed!" });
  console.log(finalState);
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("parallelization-simple.ts")) {
  main();
}
