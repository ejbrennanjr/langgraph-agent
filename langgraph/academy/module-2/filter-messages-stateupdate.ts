import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  RemoveMessage,
  SystemMessage,
} from "@langchain/core/messages";

import {
  END,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";

import { printMessages } from "../../libs/messages";

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

printMessages(messages);

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const filterMessagesNode = async (state: typeof MessagesAnnotation.State) => {
  // Delete all but the 2 most recent messages
  // Create delete_messages, which removes the last two messages and creates RemoveMessage instances

  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => {
      if (m.id !== undefined) {
        return new RemoveMessage({ id: m.id });
      }
      return null; // Handle this case appropriately if needed
    })
    .filter((message) => message !== null);

  printMessages(deleteMessages);
  return { messages: deleteMessages };
};

const chatModelNode = async (state: typeof MessagesAnnotation.State) => {
  return { messages: [await llm.invoke(state.messages)] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("filter_messages", filterMessagesNode)
  .addNode("chat_model", chatModelNode)
  .addEdge(START, "filter_messages")
  .addEdge("filter_messages", "chat_model")
  .addEdge("chat_model", END);

// Compile the graph to prepare it for execution.
export const graph = builder.compile();

// === Main Function Section ===
// This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

const main = async function () {
  console.log("Running in standalone mode..."); // Log that the main function is running.

  messages.push(new HumanMessage("Tell me more about Narwhals."));

  const finalState = await graph.invoke({ messages: messages }); // Invoke the graph with a initial value

  printMessages(finalState.messages);
};

// === Script Execution Section ===
// Conditionally run `main()` only when the script is executed directly (not imported into another module).

if (process.argv[1].endsWith("filter-messages-stateupdate.ts")) {
  main(); // Run the main function if the file is executed directly.
}
