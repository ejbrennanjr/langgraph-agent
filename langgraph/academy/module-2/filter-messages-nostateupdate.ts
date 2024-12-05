import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import {
  END,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";

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

const messages = [
  new AIMessage(`Hi. How can I help you today?`),
  new HumanMessage(`Hi.`),
  new AIMessage(`So you said you were researching ocean mammals?`),
  new HumanMessage(
    `Yes, I know about whales. But what others should I learn about?`
  ),
];

for (const m of messages) {
  console.log("%O", m.content); // %O will pretty print the object
}

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const chatModelNode = async (state: typeof MessagesAnnotation.State) => {
  return { messages: [await llm.invoke(state.messages.slice(-1))] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("chat_model", chatModelNode)
  .addEdge(START, "chat_model")
  .addEdge("chat_model", END);

// Compile the graph to prepare it for execution.
export const graph = builder.compile();

// === Main Function Section ===
// This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

const main = async function () {
  console.log("Running in standalone mode..."); // Log that the main function is running.

  messages.push(new HumanMessage("Tell me more about Narwhals."));

  const finalState = await graph.invoke({ messages: messages }); // Invoke the graph with a initial value
  console.log(finalState);
};

// === Script Execution Section ===
// Conditionally run `main()` only when the script is executed directly (not imported into another module).

if (process.argv[1].endsWith("filter-messages-nostateupdate.ts")) {
  main(); // Run the main function if the file is executed directly.
}
