// === Initialization and Setup Section ===
// This section handles environment setup and utility functions for working with file paths.

import { fileURLToPath } from "url"; // Converts file URLs into file paths (compatible with CommonJS modules).
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths.

import * as dotenv from "dotenv"; // Loads environment variables from a .env file.
import { z } from "zod"; // Zod is a TypeScript-first schema declaration and validation library.

// Imports the `tool` function from LangChain to define and register tools.
import { tool } from "@langchain/core/tools";
// Imports LangChain's ChatOpenAI module for working with OpenAI models.
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages"; // Message types used by LangChain (human, system, AI messages).

// Define the __filename and __dirname variables, which are used to resolve the current file's path.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === Environment Variables and API Key Configuration ===
// This section is responsible for loading and handling environment variables.

dotenv.config();
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY; // LangChain API Key for authentication.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI API Key for making requests to the OpenAI API.
const TAVILY_API_KEY = process.env.TAVILY_API_KEY; // Example of another API key (Tavily, not used in this case).

// Log the API keys for debugging purposes (avoid logging sensitive data in production environments).
console.log(`
=================================================================
API Keys Configuration
=================================================================
OpenAI API Key:    ${OPENAI_API_KEY}
LangChain API Key: ${LANGCHAIN_API_KEY}
Tavily API Key:    ${TAVILY_API_KEY}
=================================================================
`);

// === Tool Definitions Section ===
// In this section, we define the tools ('add' and 'multiply') using Zod for validation and LangChain's `tool()` method.

// Define the schema for the 'add' operation using Zod. This ensures that inputs for 'a' and 'b' are numbers.
const addSchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'add' tool using the tool function. It adds two numbers and follows the schema defined above.
const addTool = tool(
  async ({ a, b }) => {
    return a + b; // Function that performs addition of two numbers.
  },
  {
    name: "add", // The tool's name (used for tool calling).
    schema: addSchema, // Schema ensures that correct data types are passed to the function.
    description: "Adds a and b.", // Description used to define the tool's purpose when called by the LLM.
  }
);

// Define the schema for the 'multiply' operation, similar to the 'add' schema.
const multiplySchema = z.object({
  a: z.number(),
  b: z.number(),
});

// Define the 'multiply' tool, which multiplies two numbers using the tool function.
const multiplyTool = tool(
  async ({ a, b }) => {
    return a * b; // Function that performs multiplication of two numbers.
  },
  {
    name: "multiply", // Name of the tool, used for calling it from the LLM.
    schema: multiplySchema, // Schema ensures data validation.
    description: "Multiplies a and b.", // Description of the tool's functionality.
  }
);

// === Tool Collection Section ===
// This section is responsible for creating collections (arrays and objects) of tools to make them accessible later.

// Array of tools to be bound to the LLM (add and multiply in this case).
const tools = [addTool, multiplyTool];

// Object that maps tool names to their respective tool implementations for easy lookup.
// Type-safe map where tool names are explicitly mapped to their corresponding tool.
const toolsByName = {
  add: addTool,
  multiply: multiplyTool,
};

// === LLM Initialization Section ===
// Here, we instantiate the ChatOpenAI model and bind the tools to it.

// Create an instance of the ChatOpenAI model. The model used here is "gpt-4o-mini" (replace with actual supported model).
const llm = new ChatOpenAI({
  model: "gpt-4o-mini", // Specifies the model to be used (change to actual supported model if necessary).
  temperature: 0, // Controls the randomness of the model's output. Lower temperature means more deterministic output.
});

// Bind the defined tools (add and multiply) to the LLM instance. This enables the model to invoke these tools during conversations.
const llmWithTools = llm.bindTools(tools);

// === Message Initialization Section ===
// This section defines the initial message (conversation input) from the user (human).

// Initial message from the human (input to the LLM), asking for the sum of 2 and 3.
const messages = [new HumanMessage(`What is 2 times 3?`)];

// === Main Logic Section ===
// The main function that processes the input, handles tool invocation, and updates the conversation.

async function main() {
  // Invoke the LLM with the initial human message.
  const aiMessage = await llmWithTools.invoke(messages);

  // Log the AI's response and metadata to understand how the model processed the input.
  console.log(`Result Type: ${aiMessage}`);
  console.log(
    `Result Metadata: ${JSON.stringify(aiMessage.response_metadata)}`
  );
  console.log(`Result Tool Calls: ${JSON.stringify(aiMessage.tool_calls)}`);
  console.log(`Result: ${JSON.stringify(aiMessage)}`);

  // Append the AI's message to the messages array to track the conversation history.
  messages.push(aiMessage);
  console.log(`Updated messages: ${JSON.stringify(messages)}`);

  // === Tool Execution Section ===
  // This section handles the tool invocation based on the model's output (if any tool calls are present).

  // Iterate over tool calls (if any exist) and invoke the corresponding tool.
  for (const toolCall of aiMessage.tool_calls ?? []) {
    // Type check: Ensure that the toolCall.name matches one of the keys in toolsByName.
    // Use `keyof typeof toolsByName` to ensure TypeScript knows we are referencing the correct keys.
    const selectedTool = toolsByName[toolCall.name as keyof typeof toolsByName];
    // Invoke the selected tool with the provided arguments and add the response to the conversation.
    const toolMessage = await selectedTool.invoke(toolCall);
    messages.push(toolMessage); // Add the tool's response to the messages array.
  }
  console.log(`Messages after tool execution: ${JSON.stringify(messages)}`);

  // Invoke the LLM again, passing the updated messages with the tool responses included.
  const aiMessageAfterToolCall = await llmWithTools.invoke(messages);

  // Log the final result after the tool has been called and the model has processed the updated messages.
  console.log(`Final Result: ${JSON.stringify(aiMessageAfterToolCall)}`);
}

// === Execution Section ===
// Call the main function to execute the program.
main();
