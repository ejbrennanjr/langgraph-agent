import {
  LANGCHAIN_API_KEY,
  OPENAI_API_KEY,
  SHORTCUT_API_KEY,
  TAVILY_API_KEY,
} from "../config";

import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { Document } from "@langchain/core/documents";
import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  Annotation,
  END,
  MemorySaver,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
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

let model = new ChatOpenAI({ model: "gpt-4o" });

const cite = z.object({
  indexes: z
    .array(z.number())
    .describe("Return the index(es) of the documents that justify the claim"),
});

function generateTools(messages: BaseMessage[]) {
  const getContext = tool(
    () => {
      const docs: Document[] = [
        {
          pageContent: "FooBar company just raised 1 Billion dollars!",
          metadata: { source: "twitter" },
        },
        {
          pageContent: "FooBar company is now only hiring AI's",
          metadata: { source: "twitter" },
        },
        {
          pageContent: "FooBar company was founded in 2019",
          metadata: { source: "wikipedia" },
        },
        {
          pageContent: "FooBar company makes friendly robots",
          metadata: { source: "wikipedia" },
        },
      ];
      // Join the page content of all documents with "\n\n"
      const joinedContent: string = docs
        .map((doc) => doc.pageContent)
        .join("\n\n");

      return [joinedContent, docs];
    },
    {
      name: "get_context",
      description: "Get context on the question",
      schema: z.object({
        question: z.string().describe("The user question"),
      }),
      responseFormat: "content_and_artifact",
    }
  );

  const citeContextSources = tool(
    async (input) => {
      const docs: Document[] = [];

      // We get the potentially cited docs from past ToolMessages in our state.
      for (const msg of messages) {
        if ((msg as ToolMessage).name === "get_context") {
          docs.push(...(msg as ToolMessage).artifact);
        }
      }

      // Define the Cite interface
      const structuredModel = model.withStructuredOutput(cite);

      // Create the system prompt and context
      const system: string = `Which of the following documents best justifies the claim:\n\ninput.claim‘;constcontext:string=docs.map((doc,i)=>‘Documentinput.claim‘;constcontext:string=docs.map((doc,i)=>‘Document{input.claim}`;
      const context: string = docs
        .map((doc, i) => `Document {i}:\n${doc.pageContent}`)
        .join("\n\n");

      // Invoke the structured model to get the citation
      const citation = await structuredModel.invoke([
        { role: "system", content: system },
        { role: "user", content: context },
      ]);

      // Get the cited documents based on the indexes returned
      const citedDocs: Document[] = citation.indexes.map((i) => docs[i]);

      // Extract the sources from the cited documents
      const sources: string = citedDocs
        .map((doc) => doc.metadata.source)
        .join(", ");

      // Return the sources and cited documents
      return [sources, citedDocs];
    },
    {
      name: "cite_context_sources",
      description: "Cite which source a claim was based on.",
      schema: z.object({
        claim: z.string().describe("The claim that was made."),
      }),
      responseFormat: "content_and_artifact",
    }
  );

  return [getContext, citeContextSources];
}

let tools = generateTools([]);

console.log(zodToJsonSchema(tools[1].schema));

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const State = AgentState.State;

const routeMessage = (state: typeof State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage?.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

const callModel = async (state: typeof State) => {
  const { messages } = state;
  const tools = generateTools(messages);
  const modelWithTools = model.bindTools(tools);
  const responseMessage = await modelWithTools.invoke(messages);
  return { messages: [responseMessage] };
};

const toolNodeWithGraphState = async (state: typeof State) => {
  const { messages } = state;
  const tools = generateTools(messages);
  const toolNodeWithConfig = new ToolNode(tools);
  return toolNodeWithConfig.invoke(state);
};

const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", toolNodeWithGraphState)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

const memory = new MemorySaver();

const graph = workflow.compile({ checkpointer: memory });

// Main function to run the graph standalone
const main = async function () {
  console.log("Running in standalone mode...");
  let inputs = {
    messages: [
      {
        role: "user",
        content: "what's the latest single news item about FooBar?",
      },
    ],
  };
  let config = { configurable: { thread_id: "1" } };
  let stream = await graph.stream(inputs, {
    ...config,
  });

  for await (const chunk of stream) {
    for (const [node, values] of Object.entries(chunk)) {
      console.log(`Output from node: ${node}`);
      console.log("---");
      console.log(values);
      console.log("\n====\n");
    }
  }
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("state-to-tools.ts")) {
  main();
}
