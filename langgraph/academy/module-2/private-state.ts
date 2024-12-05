// === Imports Section ===
// This section handles all necessary imports from various libraries used in the project.

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths.
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths.

import * as dotenv from "dotenv"; // Loads environment variables from a .env file.

// Imports from LangGraph for state graph management and message annotations.
import { Annotation, END, StateGraph, START } from "@langchain/langgraph";

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

// Overall state of the graph
const OverallState = Annotation.Root({
  question: Annotation<string>,
  answer: Annotation<string>,
});

// The schema returned from the node that generates the query
const QueryOutputState = Annotation.Root({
  question: Annotation<string>,
  query: Annotation<string>,
});

// The schema returned from the node that retrieves the documents
const DocumentOutputState = Annotation.Root({
  ...QueryOutputState.spec,
  docs: Annotation<string[]>,
});

// // The schema returned from the node that generates the output
// const GenerateOutputState = Annotation.Root({
//   ...OverallState.spec,
//   ...DocumentOutputState.spec,
// });

// Node to generate the query
const generateQueryNode = async (
  state: typeof OverallState.State
): Promise<typeof QueryOutputState.State> => {
  return {
    question: state.question,
    query: state.question + " rephrased as a query!",
  };
};

// Node to retrieve the documents
const retrieveDocumentsNode = async (
  state: typeof QueryOutputState.State
): Promise<typeof DocumentOutputState.State> => {
  return {
    ...state,
    docs: ["some random document 1", "some random document 2"],
  };
};

// Node to generate the answer
const generateAnswerNode = async (
  state: typeof DocumentOutputState.State
): Promise<typeof OverallState.State> => {
  return {
    question: state.question,
    answer: "some answer to the question",
  };
};

// === Graph Building Section ===
// Build a state graph using LangGraph. Nodes represent steps in the process, and edges define transitions between nodes.
const builder = new StateGraph(OverallState)
  .addNode("generate_query", generateQueryNode)
  .addNode("retrieve_documents", retrieveDocumentsNode)
  .addNode("generate_answer", generateAnswerNode)
  .addEdge(START, "generate_query")
  .addEdge("generate_query", "retrieve_documents")
  .addEdge("retrieve_documents", "generate_answer")
  .addEdge("generate_answer", END);

// Compile the graph to prepare it for execution.
export const graph = builder.compile();

// === Main Function Section ===
// This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

const main = async function () {
  console.log("Running in standalone mode..."); // Log that the main function is running.
  const finalState = await graph.invoke({ question: "How are you?" }); // Invoke the graph with a initial value
  console.log(finalState);
};

// === Script Execution Section ===
// Conditionally run `main()` only when the script is executed directly (not imported into another module).

if (process.argv[1].endsWith("private-state.ts")) {
  main(); // Run the main function if the file is executed directly.
}
