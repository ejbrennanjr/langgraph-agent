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

// Define `node`, a function that modifies the `graphState`
const nodeX = (state: typeof GraphState.State) => {
  console.log("--- Node x---");
  return {
    graphState: `some graph state`, // Modify the state and return the new state
  };
};

// Build the graph using `StateGraph`. This defines the overall structure of the stateful graph.
// Nodes and edges define the execution flow and state transitions.
const builder = new StateGraph(GraphState).addNode("<node-x>", nodeX); // Add nodeX to the graph

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
if (process.argv[1].endsWith("<file-name>.ts")) {
  main();
}
