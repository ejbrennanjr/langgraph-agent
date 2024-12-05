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

// Define `node_1`, a function that modifies the `graphState` by appending " I am"
const node_1 = (state: typeof GraphState.State) => {
  console.log("--- Node 1 ---");
  return {
    graphState: `${state.graphState} I am`, // Modify the state and return the new state
  };
};

// Define `node_2`, a function that modifies the `graphState` by appending " happy!"
const node_2 = (state: typeof GraphState.State) => {
  console.log("--- Node 2 ---");
  return {
    graphState: `${state.graphState} 😊 !`, // Update the state to reflect a happy mood
  };
};

// Define `node_3`, a function that modifies the `graphState` by appending " sad!"
const node_3 = (state: typeof GraphState.State) => {
  console.log("--- Node 3 ---");
  return {
    graphState: `${state.graphState} sad!`, // Update the state to reflect a sad mood
  };
};

// Define `decideMood`, a conditional function that chooses between `node_2` and `node_3` based on a random condition
const decideMood = (state: typeof GraphState.State) => {
  const userInput = state.graphState; // Access the current state (not directly used here, but could be useful)

  // Randomly decide whether to go to node_2 or node_3
  if (Math.random() < 0.5) {
    return "node_2"; // 50% chance to choose node_2
  }
  return "node_3"; // 50% chance to choose node_3
};

// Build the graph using `StateGraph`. This defines the overall structure of the stateful graph.
// Nodes and edges define the execution flow and state transitions.
const builder = new StateGraph(GraphState)
  .addNode("node_1", node_1) // Add node_1 to the graph
  .addNode("node_2", node_2) // Add node_2 to the graph
  .addNode("node_3", node_3) // Add node_3 to the graph
  .addEdge(START, "node_1") // The graph starts execution from `node_1`
  .addConditionalEdges("node_1", decideMood) // Conditionally move to either `node_2` or `node_3` after `node_1`
  .addEdge("node_2", END) // End the graph execution if `node_2` is reached
  .addEdge("node_3", END); // End the graph execution if `node_3` is reached

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
if (process.argv[1].endsWith("simple-graph.ts")) {
  main();
}
