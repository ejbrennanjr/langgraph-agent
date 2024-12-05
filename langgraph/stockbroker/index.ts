import {
  FINANCIAL_DATASETS_API_KEY,
  LANGCHAIN_API_KEY,
  OPENAI_API_KEY,
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
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import { ALL_TOOLS_LIST, priceSnapshotTool, webSearchTool } from "./tools";
import { StockPurchase } from "./types";

// Define the path for __dirname and __filename (CommonJS support in ESM environments)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log API keys for confirmation (do not log sensitive data in production!)
console.log(`
=================================================================
API Keys Configuration
=================================================================
OpenAI API Key:    ${OPENAI_API_KEY}
LangChain API Key: ${LANGCHAIN_API_KEY}
Tavily API Key:    ${TAVILY_API_KEY}
Financial API Key: ${FINANCIAL_DATASETS_API_KEY}
=================================================================
`);

// ==================================================================================================================================
// Configure the OpenAI Chat API
// ==================================================================================================================================
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// ==================================================================================================================================
// Define the state graph for the stockbroker
// ==================================================================================================================================
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  requestedStockPurchaseDetails: Annotation<StockPurchase>,
  purchaseConfirmed: Annotation<boolean | undefined>,
});

// ==================================================================================================================================
// Define the nodes & edges of our stockbroker graph
// ==================================================================================================================================
const toolNode = new ToolNode(ALL_TOOLS_LIST);

const callModelNode = async (state: typeof GraphAnnotation.State) => {
  console.log("--- callModelNode ---");
  const { messages } = state;

  const systemMessage = {
    role: "system",
    content: `You're an expert financial analyst, tasked with answering the user's questions
      about a given company or companies. You do not have up-to-date information on
      the companies, so you must call tools when answering users' questions. 
      All financial data tools require a company ticker to be passed in as a parameter. 
      If you do not know the ticker, you should use the web search tool to find it.`,
  };

  const llmWithTools = llm.bindTools(ALL_TOOLS_LIST);
  const result = await llmWithTools.invoke([systemMessage, ...messages]);
  return { messages: result };
};

const shouldContinueEdge = (state: typeof GraphAnnotation.State) => {
  console.log("--- shouldContinueEdge ---");
  const { messages, requestedStockPurchaseDetails } = state;

  const lastMessage = messages[messages.length - 1];

  // Cast here since `tool_calls` does not exist on `BaseMessage`
  const messageCastAI = lastMessage as AIMessage;
  if (messageCastAI._getType() !== "ai" || !messageCastAI.tool_calls?.length) {
    // LLM did not call any tools, or it's not an AI message, so we should end.
    return END;
  }

  // If `requestedStockPurchaseDetails` is present, we want to execute the purchase
  if (requestedStockPurchaseDetails) {
    return "execute_purchase";
  }

  const { tool_calls } = messageCastAI;
  if (!tool_calls?.length) {
    throw new Error(
      "Expected tool_calls to be an array with at least one element"
    );
  }

  return tool_calls.map((tc) => {
    if (tc.name === "purchase_stock") {
      // The user is trying to purchase a stock, route to the verify purchase node.
      return "prepare_purchase_details";
    } else {
      return "tools";
    }
  });
};

const preparePurchaseDetailsNode = async (
  state: typeof GraphAnnotation.State
) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (lastMessage._getType() !== "ai") {
    throw new Error("Expected the last message to be an AI message");
  }

  // Cast here since `tool_calls` does not exist on `BaseMessage`
  const messageCastAI = lastMessage as AIMessage;
  const purchaseStockTool = messageCastAI.tool_calls?.find(
    (tc) => tc.name === "purchase_stock"
  );
  if (!purchaseStockTool) {
    throw new Error(
      "Expected the last AI message to have a purchase_stock tool call"
    );
  }
  console.log(
    `purchaseStockTool: ${JSON.stringify(purchaseStockTool, null, 2)}`
  );
  let { maxPurchasePrice, companyName, ticker } = purchaseStockTool.args;

  if (!ticker) {
    if (!companyName) {
      // The user did not provide the ticker or the company name.
      // Ask the user for the missing information. Also, if the
      // last message had a tool call we need to add a tool message
      // to the messages array.
      const toolMessages = messageCastAI.tool_calls?.map((tc) => {
        return {
          role: "tool",
          content: `Please provide the missing information for the ${tc.name} tool.`,
          id: tc.id,
        };
      });

      return {
        messages: [
          ...(toolMessages ?? []),
          {
            role: "assistant",
            content:
              "Please provide either the company ticker or the company name to purchase stock.",
          },
        ],
      };
    } else {
      // The user did not provide the ticker, but did provide the company name.
      // Call the `findCompanyName` tool to get the ticker.
      ticker = await findCompanyName(purchaseStockTool.args.companyName);
    }
  }

  if (!maxPurchasePrice) {
    // If `maxPurchasePrice` is not defined, default to the current price.
    const priceSnapshot = await priceSnapshotTool.invoke({ ticker });
    maxPurchasePrice = priceSnapshot.snapshot.price;
  }

  // Now we have the final ticker, we can return the purchase information.
  return {
    requestedStockPurchaseDetails: {
      ticker,
      quantity: purchaseStockTool.args.quantity ?? 1, // Default to one if not provided.
      maxPurchasePrice,
    },
  };
};

const executePurchaseNode = async (state: typeof GraphAnnotation.State) => {
  const { purchaseConfirmed, requestedStockPurchaseDetails } = state;
  if (!requestedStockPurchaseDetails) {
    throw new Error("Expected requestedStockPurchaseDetails to be present");
  }
  if (!purchaseConfirmed) {
    // Interrupt the node to request permission to execute the purchase.
    throw new NodeInterrupt("Please confirm the purchase before executing.");
  }

  const { ticker, quantity, maxPurchasePrice } = requestedStockPurchaseDetails;
  // Execute the purchase. In this demo we'll just return a success message.
  return {
    messages: [
      {
        role: "assistant",
        content:
          `Successfully purchased ${quantity} share(s) of ` +
          `${ticker} at $${maxPurchasePrice}/share.`,
      },
    ],
  };
};

// ==================================================================================================================================
// Node/Edge Utility Functions
// ==================================================================================================================================
const findCompanyName = async (companyName: string) => {
  // Use the web search tool to find the ticker symbol for the company.
  const searchResults: string = await webSearchTool.invoke(
    `What is the ticker symbol for ${companyName}?`
  );
  const llmWithTickerOutput = llm.withStructuredOutput(
    z
      .object({
        ticker: z.string().describe("The ticker symbol of the company"),
      })
      .describe(
        `Extract the ticker symbol of ${companyName} from the provided context.`
      ),
    { name: "extract_ticker" }
  );
  const extractedTicker = await llmWithTickerOutput.invoke([
    {
      role: "user",
      content: `Given the following search results, extract the ticker symbol for ${companyName}:\n${searchResults}`,
    },
  ]);

  return extractedTicker.ticker;
};

// ==================================================================================================================================
// Define the workflow of our stockbroker graph
// ==================================================================================================================================
const workflow = new StateGraph(GraphAnnotation)
  .addNode("agent", callModelNode)
  .addNode("tools", toolNode)
  .addNode("prepare_purchase_details", preparePurchaseDetailsNode)
  .addNode("execute_purchase", executePurchaseNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinueEdge, [
    "execute_purchase",
    "prepare_purchase_details",
    "tools",
    END,
  ])
  .addEdge("tools", "agent")
  .addEdge("prepare_purchase_details", "execute_purchase")
  .addEdge("execute_purchase", END);

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
      messages: [new HumanMessage("Purchase 1 share of Apple stock.")],
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
