import {
  LANGCHAIN_API_KEY,
  OPENAI_API_KEY,
  SHORTCUT_API_KEY,
  TAVILY_API_KEY,
} from "../config";

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import { z } from "zod";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  NodeInterrupt,
  Send,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import { listDirectoryContentsTool, loadSwaggerFileTool } from "./tools";

// Define the path for __dirname and __filename (CommonJS support in ESM environments)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log API keys for confirmation (do not log sensitive data in production!)
console.log(`
  =================================================================
  File System INFO
  =================================================================
  Filename:    ${__filename}
  Directory:   ${__dirname}
  Swagger Path: ${path.join(__dirname, "swagger.json")}
  =================================================================
  API Keys Configuration
  =================================================================
  OpenAI API Key:    ${OPENAI_API_KEY}
  LangChain API Key: ${LANGCHAIN_API_KEY}
  Shortcut API Key:  ${SHORTCUT_API_KEY}
  Tavily API Key:    ${TAVILY_API_KEY}
  =================================================================
  `);

// ==================================================================================================================================
// Configure the OpenAI Chat API
// ==================================================================================================================================
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const llmWithTools = llm.bindTools([
  listDirectoryContentsTool,
  loadSwaggerFileTool,
]);

// ==================================================================================================================================
// Define the state graph for the stockbroker
// ==================================================================================================================================
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});

// ==================================================================================================================================
// Define the nodes & edges of our stockbroker graph
// ==================================================================================================================================
const toolNode = new ToolNode([listDirectoryContentsTool, loadSwaggerFileTool]);

const agentNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- callModelNode ---");
  const { messages } = state;

  const systemMessage = {
    role: "system",
    content: `
You are a specialized software agent focused on creating LangGraph.js tools from large Swagger (OpenAPI) files. You need to use a parsing tool to selectively extract sections of these files based on user instructions, such as specific endpoints, parameters, and response structures. Your output should follow these specific patterns:

Tool-Assisted Parsing: Use a parsing tool to navigate large Swagger files and extract only the specified sections, enabling efficient handling of the file size and focusing on the user’s requirements.

Create LangGraph Tools:

Use LangGraph’s @tool decorator to define each tool.
Include a Name and Description for each tool that clearly conveys its purpose, similar to the examples provided.
Define an Input Schema using Zod. Each schema should capture required and optional parameters, including appropriate types (e.g., strings, enums, numbers), with descriptive details for each field.
Construct the Output Logic using a helper function that makes HTTP requests to the relevant API endpoint specified in the Swagger file. Implement error handling to capture and relay any issues that may arise during API calls.
Generate TypeScript Types:

Alongside each Zod schema, generate corresponding TypeScript types to provide strict type safety, ensuring compatibility with TypeScript environments.
Match the structure of TypeScript types to the Swagger definitions, covering both input and output types as required.
Focus on accuracy and alignment with JavaScript, TypeScript, and Zod best practices. Include comments to facilitate code readability and maintainability, ensuring each tool is self-contained and ready for deployment within LangGraph workflows.`,
  };

  const result = await llmWithTools.invoke([systemMessage, ...messages]);
  return { messages: result };
};

// ==================================================================================================================================
// Define the workflow of our graph
// ==================================================================================================================================
const workflow = new StateGraph(GraphAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent")
  .addEdge("agent", END);

export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});

// ==================================================================================================================================
// Running the program
// ==================================================================================================================================
async function main() {
  console.log("Running in standalone mode...");

  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };

  for await (const chunk of await graph.stream(
    {
      messages: [
        new HumanMessage(
          "Add a story to the backlog to refactor the HomePage component to support i18n."
        ),
      ],
    },
    config
  )) {
    console.log(chunk);
  }
}

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("index.ts")) {
  main();
}
