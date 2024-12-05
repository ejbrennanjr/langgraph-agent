import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

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
  new AIMessage(`So you said you were researching ocean mammals?`),
  new HumanMessage(`Yes, that's right`),
  new AIMessage(`Great, what would like to learn about?`),
  new HumanMessage(
    `I want to learn about the best place to see Orcas in the US`
  ),
];

for (const m of messages) {
  console.log("%O", m.content); // %O will pretty print the object
}

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

async function main() {
  const result = await llm.invoke(messages);
  console.log(`Result Type: ${result}`);
  console.log(`Result Metadata: ${JSON.stringify(result.response_metadata)}`);
  console.log(`Result: ${result.content}`);
}

main();
