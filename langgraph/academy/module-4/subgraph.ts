import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { Annotation, END, StateGraph, START } from "@langchain/langgraph"; // Core imports from LangGraph for creating graph-based workflows
import { string } from "zod";

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

// ==================================================================================================================================
// Shape of the Log objects we'll be peforming analysis on
// =================================================================================================================================
interface Log {
  id: string;
  question: string;
  docs?: string[]; // Optional array of strings.
  answer: string;
  grade?: number; // Optional number.
  grader?: string; // Optional string.
  feedback?: string; // Optional string.
}

// ==================================================================================================================================
// Failure Analysis Subgraph
// ==================================================================================================================================

const FailureAnalysisState = Annotation.Root({
  cleanedLogs: Annotation<Log[]>,
  failures: Annotation<Log[]>,
  faSummary: Annotation<string>,
  processedLogs: Annotation<string[]>,
});

const FailureAnalysisOutputState = Annotation.Root({
  faSummary: Annotation<string>,
  processedLogs: Annotation<string[]>,
});

const getFailuresNode = (state: typeof FailureAnalysisState.State) => {
  const cleanedLogs = state.cleanedLogs;
  const failures = cleanedLogs.filter(
    (log: { grade?: number }) => "grade" in log
  );
  return { failures };
};

const generateFailureSummaryNode = (
  state: typeof FailureAnalysisState.State
): typeof FailureAnalysisOutputState.State => {
  const failures = state["failures"];
  const faSummary = "Poor quality retrieval of Chroma documentation.";

  return {
    faSummary,
    processedLogs: failures.map(
      (failure: { id: string }) => `failure-analysis-on-log-${failure.id}`
    ),
  };
};

// Build the graph using `StateGraph`. This defines the overall structure of the stateful graph.
// Nodes and edges define the execution flow and state transitions.
const faBuilder = new StateGraph({
  input: FailureAnalysisState,
  output: FailureAnalysisOutputState,
})
  .addNode("getFailuresNode", getFailuresNode)
  .addNode("generateFailureSummaryNode", generateFailureSummaryNode)
  .addEdge(START, "getFailuresNode")
  .addEdge("getFailuresNode", "generateFailureSummaryNode")
  .addEdge("generateFailureSummaryNode", END);

// Export the compiled graph, which performs checks and prepares it for execution
export const faGraph = faBuilder.compile();

// ==================================================================================================================================
// Summarization Subgraph
// ==================================================================================================================================

const QuestionSummarizationState = Annotation.Root({
  cleanedLogs: Annotation<Log[]>,
  qsSummary: Annotation<string>,
  report: Annotation<string>,
  processedLogs: Annotation<string[]>,
});

const QuestionSummarizationOutputState = Annotation.Root({
  report: Annotation<string>,
  processedLogs: Annotation<string[]>,
});

const generateSummaryNode = (
  state: typeof QuestionSummarizationState.State
) => {
  const cleanedLogs = state["cleanedLogs"];
  const summary =
    "Questions focused on usage of ChatOllama and Chroma vector store.";

  return {
    qsSummary: summary,
    processedLogs: cleanedLogs.map(
      (log: { id: string }) => `summary-on-log-${log.id}`
    ),
  };
};

const sendToSlackNode = (state: typeof QuestionSummarizationState.State) => {
  const qsSummary = state.qsSummary;
  const report = `foo bar baz`;
  return { report };
};

const qsBuilder = new StateGraph({
  input: QuestionSummarizationState,
  output: QuestionSummarizationOutputState,
})
  .addNode("generateSummaryNode", generateSummaryNode)
  .addNode("sendToSlackNode", sendToSlackNode)
  .addEdge(START, "generateSummaryNode")
  .addEdge("generateSummaryNode", "sendToSlackNode")
  .addEdge("sendToSlackNode", END);

// Export the compiled graph, which performs checks and prepares it for execution
export const qsGraph = qsBuilder.compile();

// ==================================================================================================================================
// Entry Graph
// ==================================================================================================================================

// Define the entry graph state using Annotation.Root with camelCase
const EntryGraphState = Annotation.Root({
  rawLogs: Annotation<Log[]>(),
  cleanedLogs: Annotation<Log[]>,
  faSummary: Annotation<string>(), // This will only be generated in the FA sub-graph
  report: Annotation<string>(), // This will only be generated in the QS sub-graph
  processedLogs: Annotation<number[]>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
  }), //This will be generated in BOTH sub-graphs
});

const cleanLogsNode = (state: typeof EntryGraphState.State) => {
  const rawLogs = state.rawLogs;
  const cleanedLogs = rawLogs;
  return { cleanedLogs };
};

const entryBuilder = new StateGraph(EntryGraphState)
  .addNode("cleanLogsNode", cleanLogsNode)
  .addNode("faGraph", faGraph)
  .addNode("qsGraph", qsGraph)
  .addEdge(START, "cleanLogsNode")
  .addEdge("cleanLogsNode", "faGraph")
  .addEdge("cleanLogsNode", "qsGraph")
  .addEdge("faGraph", END)
  .addEdge("qsGraph", END);

// Export the compiled graph, which performs checks and prepares it for execution
export const entryGraph = entryBuilder.compile();

// Main function to run the graph standalone
const main = async function () {
  console.log("Running in standalone mode...");

  // Define the dummy log objects to be processed
  const questionAnswer: Log = {
    id: "1",
    question: "How can I import ChatOllama?",
    answer:
      "To import ChatOllama, use: 'from langchain_community.chat_models import ChatOllama.'",
    // Optional fields are omitted since they are not required
  };

  const questionAnswerFeedback: Log = {
    id: "2",
    question: "How can I use Chroma vector store?",
    answer:
      "To use Chroma, define: rag_chain = create_retrieval_chain(retriever, question_answer_chain).",
    grade: 0,
    grader: "Document Relevance Recall",
    feedback:
      "The retrieved documents discuss vector stores in general, but not Chroma specifically",
    // Optional fields like 'docs' are omitted if not needed
  };

  const rawLogs = [questionAnswer, questionAnswerFeedback];

  const finalState = await entryGraph.invoke({ rawLogs });
  console.log(finalState);
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("subgraph.ts")) {
  main();
}
