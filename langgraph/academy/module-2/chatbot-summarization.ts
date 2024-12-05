// === Imports Section ===
// This section handles all necessary imports from various libraries used in the project.

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths.
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths.

import * as dotenv from "dotenv"; // Loads environment variables from a .env file.
import { z } from "zod"; // Zod is a TypeScript-first schema declaration and validation library.

// Imports the `tool` function from LangChain to define and register tools.
import { tool } from "@langchain/core/tools";
// Imports LangChain's ChatOpenAI module for working with OpenAI models.
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  RemoveMessage,
  SystemMessage,
} from "@langchain/core/messages";
// Imports from LangGraph for state graph management and message annotations.
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

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

// === LLM Initialization Section ===
// Here, we create an instance of the ChatOpenAI model and bind the tools defined above.

const llm = new ChatOpenAI({
  model: "gpt-4o-mini", // Specifies the OpenAI model being used.
  temperature: 0, // Controls the randomness of the output (0 for deterministic responses).
});

// === State Section ===
const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec, // Spread in the messages state
  summary: Annotation<string>, // extend with a summary channel
});

// === Graph Node Definition Section ===
const callModelNode = async function callModelNode(
  state: typeof GraphState.State
) {
  // Get summary if it exists
  const summary = state["summary"] || "";

  // Define messages array
  let messages: BaseMessage[];

  // If there is a summary, add it to the system message
  if (summary) {
    const systemMessage = `Summary of conversation earlier: ${summary}`;
    // Append summary to newer messages
    messages = [new SystemMessage(systemMessage), ...state.messages];
  } else {
    messages = state.messages;
  }

  // Call the model and get the response
  const response = await llm.invoke(messages);

  return { messages: response };
};

const summarizeConversationNode = async function summarizeConversation(
  state: typeof GraphState.State
) {
  // Get the existing summary
  const summary = state["summary"] || "";

  // Define messages array
  let summary_message: string;

  // If there is a summary, add it to the system message
  if (summary) {
    summary_message = `This is summary of the conversation to date: {summary}\n\nExtend the summary by taking into account the new messages above:`;
  } else {
    summary_message = `Create a summary of the conversation above:`;
  }

  const messages = [...state.messages, new HumanMessage(summary_message)];

  // Call the model and get the response
  const response = await llm.invoke(messages);

  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => {
      if (m.id !== undefined) {
        return new RemoveMessage({ id: m.id });
      }
      return null; // Handle this case appropriately if needed
    })
    .filter((message) => message !== null);

  return { summary: response.content, messages: deleteMessages };
};

const shouldContinue = async function shouldContinue(
  state: typeof GraphState.State
) {
  const messages = state.messages;

  //If there are more than six messages, then we summarize the conversation
  if (messages.length > 6) {
    return "summarizeConversation";
  }

  return END;
};

// === Graph Building Section ===
// Build a state graph using LangGraph. Nodes represent steps in the process, and edges define transitions between nodes.

const builder = new StateGraph(GraphState)
  .addNode("conversation", callModelNode)
  .addNode("summarizeConversation", summarizeConversationNode)
  .addEdge(START, "conversation")
  .addConditionalEdges("conversation", shouldContinue)
  .addEdge("summarizeConversation", END);

// Initialize a CheckPointSaver
// const memory = new MemorySaver();
// Compile the graph to prepare it for execution.
export const graph = builder
  .compile
  // { checkpointer: memory }
  ();

// === Main Function Section ===
// This is the main function that runs the graph in standalone mode. It invokes the graph with predefined human messages.

const main = async function () {
  console.log("Running in standalone mode..."); // Log that the main function is running.

  const config = {
    configurable: {
      thread_id: "1",
    },
  };

  const inputMessage1 = new HumanMessage("hi! I'm Lance");
  await invokeAndPrint(inputMessage1, graph, config);

  const inputMessage2 = new HumanMessage("what's my name?");
  await invokeAndPrint(inputMessage2, graph, config);

  const inputMessage3 = new HumanMessage("I like the 49ers!");
  await invokeAndPrint(inputMessage3, graph, config);

  console.log(
    `summary = ${
      (await (await graph.getState(config)).values["summary"]) || ""
    } `
  );

  const inputMessage4 = new HumanMessage(
    "I like Nick Bosa, isn't he the highest paid defensive player?"
  );
  await invokeAndPrint(inputMessage4, graph, config);

  console.log(
    `\n\nsummary = ${
      (await (await graph.getState(config)).values["summary"]) || ""
    } `
  );
};

// === Script Execution Section ===
// Conditionally run `main()` only when the script is executed directly (not imported into another module).

if (process.argv[1].endsWith("chatbot-summarization.ts")) {
  main(); // Run the main function if the file is executed directly.
}

// === Helper Functions Section ===
async function invokeAndPrint(
  inputMessage: HumanMessage,
  graph: any,
  config: any = {}
) {
  console.log(
    `\n================================ ${inputMessage._getType()} Message =================================`
  );
  console.log(inputMessage.content);

  const output = await graph.invoke({ messages: [inputMessage] }, config);
  const messages = output.messages;

  // Loop through the last message and print it
  for (const m of messages.slice(-1)) {
    console.log(
      `\n================================ ${m._getType()} Message =================================`
    );
    console.log(m.content);
  }
}
