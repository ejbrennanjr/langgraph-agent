import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { TavilySearchResults } from "@langchain/community/tools/tavily_search"; // Import the TavilySearchResults type from the Tavily tool
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run"; // Import the WikipediaQueryRun type from the Wikipedia tool
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, StateGraph, START } from "@langchain/langgraph"; // Core imports from LangGraph for creating graph-based workflows
import { ChatOpenAI } from "@langchain/openai";

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

// Define the OpenAI model for the ChatOpenAI tool
const llm = new ChatOpenAI({
  model: "gpt-4o-mini", // Specifies the OpenAI model being used.
  temperature: 0, // Controls the randomness of the output (0 for deterministic responses).
});

// Define the graph's state using `Annotation.Root`. This sets up a "channel" in LangGraph's terminology.
// Channels are fields of the state and can have default values and reducers. Here, we define `graphState` as a string channel.
const GraphState = Annotation.Root({
  question: Annotation<string>(),
  answer: Annotation<string>(),
  context: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

// Define `searchWebNode`, a function that modifies the `graphState`
const searchWebNode = async (state: typeof GraphState.State) => {
  console.log("--- searchWebNode ---");

  const tool = new TavilySearchResults({
    maxResults: 3,
  });

  const searchDocs = await tool.invoke({
    input: state.question,
  });

  const searchDocsJSON = JSON.parse(searchDocs);
  console.log(typeof searchDocsJSON);
  console.log(searchDocsJSON);

  const formattedSearchDocs = searchDocsJSON
    .map(
      ({ url, content }: { url: string; content: string }) =>
        `<Document href="${url}"/>\n${content}\n</Document>`
    )
    .join("\n\n---\n\n");

  return {
    context: [formattedSearchDocs],
  };
};

// Define `searchWebNode`, a function that modifies the `graphState`
const searchWikipediaNode = async (state: typeof GraphState.State) => {
  console.log("--- searchWikipediaNode ---");

  const tool = new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  });

  const searchDocs = await tool.invoke({
    input: state.question,
  });

  // console.log(typeof searchDocs);

  // const formattedSearchDocs = searchDocs
  //   .map(
  //     ({
  //       metadata,
  //       page_content,
  //     }: {
  //       metadata: { source: string; page?: string };
  //       page_content: string;
  //     }) =>
  //       `<Document source="${metadata.source}" page="${
  //         metadata.page || ""
  //       }"/>\n${page_content}\n</Document>`
  //   )
  //   .join("\n\n---\n\n");

  return {
    context: [searchDocs],
  };
};

const generateAnswer = async (state: typeof GraphState.State) => {
  console.log("--- generateAnswer ---");

  const context = state.context;
  const question = state.question;

  const answerInstructions = `Answer the question ${question} using this context: ${context}`;

  // Answer using the LLM
  const answer = await llm.invoke([
    new SystemMessage({ content: answerInstructions }),
    new HumanMessage({ content: "Answer the question." }),
  ]);

  // Append the answer to state
  return { answer };
};

// Build the graph using `StateGraph`. This defines the overall structure of the stateful graph.
// Nodes and edges define the execution flow and state transitions.
const builder = new StateGraph(GraphState)
  .addNode("searchWeb", searchWebNode)
  .addNode("searchWikipedia", searchWikipediaNode)
  .addNode("generateAnswer", generateAnswer)
  .addEdge(START, "searchWeb")
  .addEdge(START, "searchWikipedia")
  .addEdge("searchWeb", "generateAnswer")
  .addEdge("searchWikipedia", "generateAnswer")
  .addEdge("generateAnswer", END);

// Export the compiled graph, which performs checks and prepares it for execution
export const graph = builder.compile();

// Main function to run the graph standalone
const main = async function () {
  console.log("Running in standalone mode...");
  const finalState = await graph.invoke({
    question: "How were Nvidia's Q2 2024 earnings",
  });
  console.log(finalState.answer.content);
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("parallelization-rag.ts")) {
  main();
}
