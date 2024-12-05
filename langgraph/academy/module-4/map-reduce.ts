import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file
import { z } from "zod";

import { Annotation, END, Send, StateGraph, START } from "@langchain/langgraph"; // Core imports from LangGraph for creating graph-based workflows
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

// ==================================================================================================================================
// Prompt Template Generation Functions
// ==================================================================================================================================
const subjectsPrompt = (topic: string) =>
  `Generate a list of 3 subjects that are all related to this overall topic: ${topic}.`;

const jokePrompt = (subject: string) => `Generate a joke about ${subject}`;

const bestJokePrompt = (topic: string, jokes: string) =>
  `Below are a bunch of jokes about ${topic}. Select the best one! Return the ID of the best one, starting 0 as the ID for the first joke. Jokes:\n\n ${jokes}`;

// LLM model
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// ==================================================================================================================================
// Define Zod Schemas to be used as structured outputs
// ==================================================================================================================================

// Define the Subjects schema
const Subjects = z.object({
  subjects: z.array(z.string()),
});

// Define the BestJoke schema
const BestJoke = z.object({
  id: z.number(),
});

const Joke = z.object({
  joke: z.string(),
});

// ==================================================================================================================================
// Define Overall Graph
// ==================================================================================================================================

// Overall graph state
const OverallState = Annotation.Root({
  topic: Annotation<string>(),
  subjects: Annotation<string[]>(),
  jokes: Annotation<any[]>({
    reducer: (left: any[], right: any[]) => [...left, ...right],
  }), // Equivalent of `operator.add` in Python
  bestSelectedJoke: Annotation<string>(),
});

const generateTopicsNode = async (state: typeof OverallState.State) => {
  console.log("--- generateTopicsNode ---");
  // Use the existing subjectsPrompt function to generate the prompt
  const prompt = subjectsPrompt(state.topic);

  // Invoke the model with structured output for the Subjects annotation
  const response = await llm.withStructuredOutput(Subjects).invoke(prompt);

  // Return the subjects from the response
  return { subjects: response.subjects };
};

const continueToJokesEdge = async function continueToJokesEdge(
  state: typeof OverallState.State
) {
  console.log("--- continueToJokesNode ---");
  return state.subjects.map(
    (subject: string) => new Send("generateJoke", { subject })
  );
};

// ==================================================================================================================================
// Jokes Generation (MAP Phase)
// ==================================================================================================================================
const JokeState = Annotation.Root({
  subject: Annotation<string>(),
});

const generateJokeNode = async (state: typeof JokeState.State) => {
  console.log("--- generateJokeNode ---");
  const prompt = jokePrompt(state.subject);
  const response = await llm.withStructuredOutput(Joke).invoke(prompt);
  return { jokes: [response.joke] };
};

// ==================================================================================================================================
// Best Joke Selection (REDUCE Phase)
// ==================================================================================================================================
const bestJokeNode = async (state: typeof OverallState.State) => {
  console.log("--- bestJokeNode ---");
  const jokes = state.jokes.join("\n\n");
  const prompt = bestJokePrompt(state.topic, jokes);
  const response = await llm.withStructuredOutput(BestJoke).invoke(prompt);
  return { bestSelectedJoke: state.jokes[response.id] };
};

// ==================================================================================================================================
// Create Graph Workflow
// ==================================================================================================================================
const builder = new StateGraph(OverallState)
  .addNode("generateTopics", generateTopicsNode)
  .addNode("generateJoke", generateJokeNode)
  .addNode("bestJoke", bestJokeNode)
  .addEdge(START, "generateTopics")
  .addConditionalEdges("generateTopics", continueToJokesEdge, ["generateJoke"]) // The Send node is used to send the subject to the generateJokeNode
  .addEdge("generateJoke", "bestJoke")
  .addEdge("bestJoke", END);

export const graph = builder.compile();

// Main function to run the graph standalone
const main = async function () {
  console.log("Running in standalone mode...");

  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };

  // Use for-await-of to handle streaming in TypeScript
  for await (const chunk of await graph.stream({ topic: "animals" }, config)) {
    console.log(chunk);
    console.log("\n====\n");
  }
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("map-reduce.ts")) {
  main();
}
