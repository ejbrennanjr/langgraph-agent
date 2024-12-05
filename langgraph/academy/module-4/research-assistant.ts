import { fileURLToPath } from "url"; // Utility to convert file URLs to paths
import path, { dirname } from "path"; // Provides utilities for working with file and directory paths

import * as dotenv from "dotenv"; // Loads environment variables from a .env file
import { z } from "zod";

import { TavilySearchResults } from "@langchain/community/tools/tavily_search"; // Import the TavilySearchResults type from the Tavily tool
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run"; // Import the WikipediaQueryRun type from the Wikipedia tool
import {
  AIMessage,
  getBufferString,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  Send,
  StateGraph,
  START,
} from "@langchain/langgraph"; // Core imports from LangGraph for creating graph-based workflows
import { ChatOpenAI } from "@langchain/openai";
import { get } from "http";

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
// Configure the OpenAI Chat API
// ==================================================================================================================================

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// ==================================================================================================================================
// Define Analysts SubGraph
// ==================================================================================================================================

// Define the Analyst schema
const Analyst = z.object({
  affiliation: z.string().describe("Primary affiliation of the analyst."),
  name: z.string().describe("Name of the analyst."),
  role: z.string().describe("Role of the analyst in the context of the topic."),
  description: z
    .string()
    .describe("Description of the analyst focus, concerns, and motives."),
});

// Add the persona method functionality
const generatePersona = (analyst: z.infer<typeof Analyst>) => {
  return `Name: ${analyst.name}\nRole: ${analyst.role}\nAffiliation: ${analyst.affiliation}\nDescription: ${analyst.description}\n`;
};

// Define the Perspectives schema
const Perspectives = z.object({
  analysts: z
    .array(Analyst)
    .describe(
      "Comprehensive list of analysts with their roles and affiliations."
    ),
});

// Define GenerateAnalystsState using LangGraph's Annotation.Root
const GenerateAnalystsState = Annotation.Root({
  topic: Annotation<string>(),
  maxAnalysts: Annotation<number>(),
  humanAnalystFeedback: Annotation<string>(),
  analysts: Annotation<z.infer<typeof Analyst>[]>(),
});

const analystInstructions = (
  topic: string,
  humanAnalystFeedback: string,
  maxAnalysts: number
) => `
You are tasked with creating a set of 3 AI analyst personas. Follow these instructions carefully:
1. First, review the research topic: ${topic}
2. Examine any editorial feedback that has been optionally provided to guide creation of the analysts: ${humanAnalystFeedback}
3. Determine the most interesting themes based upon documents and/or feedback above.
4. Pick the top ${maxAnalysts} themes.
5. Assign one analyst to each theme.
`;

const createAnalystsNode = async (
  state: typeof GenerateAnalystsState.State
) => {
  console.log("--- createAnalystsNode ---");
  // Extract values from state
  const { topic, maxAnalysts, humanAnalystFeedback = "" } = state;

  // Enforce structured output with the Perspectives schema
  const structuredLLM = llm.withStructuredOutput(Perspectives);

  // Generate the system message with instructions
  const systemMessage = analystInstructions(
    topic,
    humanAnalystFeedback,
    maxAnalysts
  );

  // Invoke the LLM to generate the set of analysts
  const analystsResponse = await structuredLLM.invoke([
    new SystemMessage({ content: systemMessage }),
    new HumanMessage({ content: "Generate the set of analysts." }),
  ]);

  // Return the generated analysts from the response
  return { analysts: analystsResponse.analysts };
};

const humanFeedbackNode = async (state: typeof GenerateAnalystsState.State) => {
  console.log("--- humanFeedbackNode ---");
  return state;
};

const shouldContinueEdge = async (
  state: typeof GenerateAnalystsState.State
) => {
  console.log("--- shouldContinueEdge ---");
  const { humanAnalystFeedback } = state;
  if (humanAnalystFeedback) {
    return "createAnalysts";
  }

  // Otherwise, end the process
  return END;
};

const builderAnalystsSubGraph = new StateGraph(GenerateAnalystsState)
  .addNode("createAnalysts", createAnalystsNode)
  .addNode("humanFeedback", humanFeedbackNode)
  .addEdge(START, "createAnalysts")
  .addEdge("createAnalysts", "humanFeedback")
  .addConditionalEdges("humanFeedback", shouldContinueEdge, [
    "createAnalysts",
    END,
  ]);

// Initialize a CheckPointSaver
const memoryAnalystsSubGraph = new MemorySaver();
// Compile the graph to prepare it for execution.
export const graphAnalystsSubGraph = builderAnalystsSubGraph.compile({
  checkpointer: memoryAnalystsSubGraph,
  interruptBefore: ["humanFeedback"],
});

// ==================================================================================================================================
// Define Interview SubGraph
// ==================================================================================================================================

// Define InterviewState using LangGraph's Annotation.Root
const InterviewState = Annotation.Root({
  ...MessagesAnnotation.spec,
  maxNumTurns: Annotation<number>(), // Number turns of conversation
  context: Annotation<string[]>({
    reducer: (left: string[] = [], right: string[] = []) => [
      ...(left || []),
      ...(right || []),
    ],
  }), // Source docs
  analyst: Annotation<z.infer<typeof Analyst>>(), // Analyst asking questions
  interview: Annotation<string>(), // Interview transcript
  sections: Annotation<string[]>({
    reducer: (left: string[] = [], right: string[]) => [...left, ...right],
  }), // Final key we duplicate in outer state for Send() API
});

const SearchQuery = z.object({
  searchQuery: z.string().optional().describe("Search query for retrieval."),
});

// Instructions for generating the question
const questionInstructions = (goals: string) => `
You are an analyst tasked with interviewing an expert to learn about a specific topic. 
Your goal is to boil down to interesting and specific insights related to your topic.
1. Interesting: Insights that people will find surprising or non-obvious.
2. Specific: Insights that avoid generalities and include specific examples from the expert.
Here is your topic of focus and set of goals: ${goals}
Begin by introducing yourself using a name that fits your persona, and then ask your question.
Continue to ask questions to drill down and refine your understanding of the topic.
When you are satisfied with your understanding, complete the interview with: "Thank you so much for your help!"
Remember to stay in character throughout your response, reflecting the persona and goals provided to you.
`;

// Define the function to generate a question
const generateQuestionNode = async (state: typeof InterviewState.State) => {
  console.log("--- generateQuestionNode ---");
  // Get state data
  const { analyst, messages } = state;

  // Generate system message using the instructions template
  const systemMessage = questionInstructions(generatePersona(analyst));

  // Invoke the LLM to generate the next question
  const question = await llm.invoke([
    new SystemMessage({ content: systemMessage }),
    ...messages,
  ]);

  // Write the question back to state
  return { messages: [question] };
};

// Define the search instructions as a system message
const searchInstructions = new SystemMessage({
  content: `
You will be given a conversation between an analyst and an expert.
Your goal is to generate a well-structured query for use in retrieval and/or web-search related to the conversation.
1. First, analyze the full conversation.    
2. Pay particular attention to the final question posed by the analyst.
3. Convert this final question into a well-structured web search query.
`,
});

// Define `searchWebNode`, a function that modifies the `graphState`
const searchWebNode = async (state: typeof InterviewState.State) => {
  console.log("--- searchWebNode ---");

  const tool = new TavilySearchResults({
    maxResults: 3,
  });

  const structuredLLM = llm.withStructuredOutput(SearchQuery);
  const query = await structuredLLM.invoke([
    searchInstructions,
    ...state.messages,
  ]);

  const searchDocs = await tool.invoke({
    input: query.searchQuery,
  });

  const searchDocsJSON = JSON.parse(searchDocs);
  console.log(typeof searchDocsJSON);
  console.log(searchDocsJSON);

  const formattedSearchDocs = searchDocsJSON
    .map(
      (doc: { url: string; content: string }) =>
        `<Document href="${doc.url}"/>\n${doc.content}\n</Document>`
    )
    .join("\n\n---\n\n");

  return {
    context: [formattedSearchDocs],
  };
};

// Define `searchWebNode`, a function that modifies the `graphState`
const searchWikipediaNode = async (state: typeof InterviewState.State) => {
  console.log("--- searchWikipediaNode ---");

  const tool = new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  });

  const structuredLLM = llm.withStructuredOutput(SearchQuery);
  const query = await structuredLLM.invoke([
    searchInstructions,
    ...state.messages,
  ]);

  const searchDocs = await tool.invoke({
    input: query.searchQuery,
  });

  return {
    context: [searchDocs],
  };
};

const answerInstructions = (goals: string, context: string[]) => `
You are an expert being interviewed by an analyst.
Here is the analyst's area of focus: ${goals}.
Your goal is to answer a question posed by the interviewer.
To answer the question, use this context:
${context}

When answering questions, follow these guidelines:
1. Use only the information provided in the context. 
2. Do not introduce external information or make assumptions beyond what is explicitly stated in the context.
3. The context contains sources at the top of each individual document.
4. Include these sources in your answer next to any relevant statements. For example, for source #1 use [1]. 
5. List your sources in order at the bottom of your answer. [1] Source 1, [2] Source 2, etc.
6. If the source is: <Document source="assistant/docs/llama3_1.pdf" page="7"/> then just list: 
[1] assistant/docs/llama3_1.pdf, page 7
And skip the addition of the brackets as well as the Document source preamble in your citation.
`;

// Define the function to generate an answer
const generateAnswerNode = async (state: typeof InterviewState.State) => {
  console.log("--- generateAnswerNode ---");
  // Get state data
  const { analyst, messages, context } = state;

  // Generate system message using the instructions template
  const systemMessage = answerInstructions(generatePersona(analyst), context);

  // Invoke the LLM to generate the next answer
  const answer = await llm.invoke([
    new SystemMessage({ content: systemMessage }),
    ...messages,
  ]);

  answer.name = "expert";

  // Write the question back to state
  return { messages: [answer] };
};

// Define the function to save the interview
const saveInterviewNode = async (state: typeof InterviewState.State) => {
  console.log("--- saveInterviewNode ---");
  const { messages } = state;
  const interview = getBufferString(messages);

  return { interview };
};

const routeMessagesEdge = (state: typeof InterviewState.State) => {
  // Destructure state to extract necessary fields
  const { messages, maxNumTurns = 2 } = state;

  // Count the number of expert responses
  const numResponses = messages.filter(
    (message: any) => message instanceof AIMessage && message.name === "expert"
  ).length;

  // End if the expert has answered more than the max turns
  if (numResponses >= maxNumTurns) {
    return "saveInterview";
  }

  // Check the second-to-last message for the "thank you" phrase
  const lastQuestion = messages[messages.length - 2];

  if (
    lastQuestion.content.toString().includes("Thank you so much for your help")
  ) {
    return "saveInterview";
  }

  return "askQuestion";
};

const sectionWriterInstructions = (focus: string) => `
You are an expert technical writer. 
Your task is to create a short, easily digestible section of a report based on a set of source documents.
1. Analyze the content of the source documents: 
- The name of each source document is at the start of the document, with the <Document> tag.
2. Create a report structure using markdown formatting:
- Use ## for the section title
- Use ### for sub-section headers
3. Write the report following this structure:
a. Title (## header)
b. Summary (### header)
c. Sources (### header)
4. Make your title engaging based upon the focus area of the analyst: 
${focus}
5. For the summary section:
- Set up summary with general background / context related to the focus area of the analyst
- Emphasize what is novel, interesting, or surprising about insights gathered from the interview
- Create a numbered list of source documents, as you use them
- Do not mention the names of interviewers or experts
- Aim for approximately 400 words maximum
- Use numbered sources in your report (e.g., [1], [2]) based on information from source documents
6. In the Sources section:
- Include all sources used in your report
- Provide full links to relevant websites or specific document paths
- Separate each source by a newline. Use two spaces at the end of each line to create a newline in Markdown.
- It will look like:
### Sources
[1] Link or Document name
[2] Link or Document name
7. Be sure to combine sources. For example, this is not correct:
[3] https://ai.meta.com/blog/meta-llama-3-1/
[4] https://ai.meta.com/blog/meta-llama-3-1/
There should be no redundant sources. It should simply be:
[3] https://ai.meta.com/blog/meta-llama-3-1/
8. Final review:
- Ensure the report follows the required structure
- Include no preamble before the title of the report
- Check that all guidelines have been followed
`;

const writeSectionNode = async (state: typeof InterviewState.State) => {
  // Destructure state to extract necessary fields
  const { context, analyst } = state;

  // Generate system message using the section writer instructions
  const systemMessage = sectionWriterInstructions(analyst.description);

  // Invoke the LLM with the system message and the human message containing context
  const sectionResponse = await llm.invoke([
    new SystemMessage({ content: systemMessage }),
    new HumanMessage({
      content: `Use this source to write your section: ${context}`,
    }),
  ]);

  // Append the generated section to the state and return it
  return { sections: [sectionResponse.content] };
};

// Assuming InterviewState and nodes are defined
const builderInterviewSubGraph = new StateGraph(InterviewState)
  .addNode("askQuestion", generateQuestionNode)
  .addNode("searchWeb", searchWebNode)
  .addNode("searchWikipedia", searchWikipediaNode)
  .addNode("answerQuestion", generateAnswerNode)
  .addNode("saveInterview", saveInterviewNode)
  .addNode("writeSection", writeSectionNode)

  // Define the flow
  .addEdge(START, "askQuestion")
  .addEdge("askQuestion", "searchWeb")
  .addEdge("askQuestion", "searchWikipedia")
  .addEdge("searchWeb", "answerQuestion")
  .addEdge("searchWikipedia", "answerQuestion")
  .addConditionalEdges("answerQuestion", routeMessagesEdge, [
    "askQuestion",
    "saveInterview",
  ])
  .addEdge("saveInterview", "writeSection")
  .addEdge("writeSection", END);

const memoryInterviewSubGraph = new MemorySaver();
const graphInterviewSubGraph = builderInterviewSubGraph
  .compile({
    checkpointer: memoryInterviewSubGraph,
  })
  .withConfig({ runName: "Conduct Interviews" });

// ==================================================================================================================================
// Define the overall Research Assistant Graph
// ==================================================================================================================================

// Define ResearchGraphState
const ResearchGraphState = Annotation.Root({
  topic: Annotation<string>(), // Research topic
  maxAnalysts: Annotation<number>(), // Number of analysts
  humanAnalystFeedback: Annotation<string>(), // Human feedback
  analysts: Annotation<z.infer<typeof Analyst>[]>(), // List of analysts using the Zod schema
  sections: Annotation<string[]>({
    reducer: (left: string[] = [], right: string[] = []) => [
      ...(left || []),
      ...(right || []),
    ],
  }), // Send() API key for sections, concatenating arrays
  introduction: Annotation<string>(), // Introduction for the final report
  content: Annotation<string>(), // Content for the final report
  conclusion: Annotation<string>(), // Conclusion for the final report
  finalReport: Annotation<string>(), // Final report
});

// Define the function to initiate all interviews
const initiateAllInterviewsNode = (state: typeof ResearchGraphState.State) => {
  // Check if human feedback is available
  const { humanAnalystFeedback, topic, analysts } = state;

  if (humanAnalystFeedback.toLowerCase() !== "approve") {
    // Return to create analysts
    return "createAnalysts";
  }

  // Otherwise, kick off interviews in parallel using Send API
  return analysts.map(
    (analyst) =>
      new Send("conductInterview", {
        analyst,
        messages: [
          new HumanMessage({
            content: `So you said you were writing an article on ${topic}?`,
          }),
        ],
      })
  );
};

const reportWriterInstructions = (topic: string, context: string) => `
  You are a technical writer creating a report on this overall topic: 
  
  ${topic}
      
  You have a team of analysts. Each analyst has done two things: 
  
  1. They conducted an interview with an expert on a specific sub-topic.
  2. They wrote up their findings into a memo.
  
  Your task: 
  
  1. You will be given a collection of memos from your analysts.
  2. Think carefully about the insights from each memo.
  3. Consolidate these into a crisp overall summary that ties together the central ideas from all of the memos. 
  4. Summarize the central points in each memo into a cohesive single narrative.
  
  To format your report:
   
  1. Use markdown formatting. 
  2. Include no preamble for the report.
  3. Use no sub-heading. 
  4. Start your report with a single title header: ## Insights
  5. Do not mention any analyst names in your report.
  6. Preserve any citations in the memos, which will be annotated in brackets, for example [1] or [2].
  7. Create a final, consolidated list of sources and add to a Sources section with the \`## Sources\` header.
  8. List your sources in order and do not repeat.
  
  [1] Source 1
  [2] Source 2
  
  Here are the memos from your analysts to build your report from: 
  
  ${context}
`;

// Define the writeReportNode function
const writeReportNode = async (state: typeof ResearchGraphState.State) => {
  // Full set of sections and topic from state
  const { sections, topic } = state;

  // Concatenate all sections together
  const formattedStrSections = sections.join("\n\n");

  // Prepare the system message using the reportWriterInstructions
  const systemMessage = reportWriterInstructions(topic, formattedStrSections);

  // Invoke the LLM to generate the report
  const report = await llm.invoke([
    new SystemMessage({ content: systemMessage }),
    new HumanMessage({ content: "Write a report based upon these memos." }),
  ]);

  // Return the generated content from the report
  return { content: report.content };
};

const introConclusionInstructions = (
  topic: string,
  formattedStrSections: string
) => `
You are a technical writer finishing a report on ${topic}.
You will be given all of the sections of the report.
Your job is to write a crisp and compelling introduction or conclusion section.
The user will instruct you whether to write the introduction or conclusion.
Include no preamble for either section.
Target around 100 words, crisply previewing (for introduction) or recapping (for conclusion) all of the sections of the report.
Use markdown formatting.
For your introduction, create a compelling title and use the # header for the title.
For your introduction, use ## Introduction as the section header.
For your conclusion, use ## Conclusion as the section header.
Here are the sections to reflect on for writing: ${formattedStrSections}
`;

// Define the function to write the introduction
const writeIntroductionNode = async (
  state: typeof ResearchGraphState.State
) => {
  // Full set of sections and topic from state
  const { sections, topic } = state;

  // Concatenate all sections together
  const formattedStrSections = sections.join("\n\n");

  // Prepare the instructions for the LLM
  const instructions = introConclusionInstructions(topic, formattedStrSections);

  // Invoke the LLM to write the introduction
  const intro = await llm.invoke([
    new SystemMessage({ content: instructions }),
    new HumanMessage({ content: "Write the report introduction" }),
  ]);

  // Return the generated introduction content
  return { introduction: intro.content };
};

// Define the function to write the conclusion
const writeConclusionNode = async (state: typeof ResearchGraphState.State) => {
  // Full set of sections and topic from state
  const { sections, topic } = state;

  // Concatenate all sections together
  const formattedStrSections = sections.join("\n\n");

  // Prepare the instructions for the LLM
  const instructions = introConclusionInstructions(topic, formattedStrSections);

  // Invoke the LLM to write the conclusion
  const conclusion = await llm.invoke([
    new SystemMessage({ content: instructions }),
    new HumanMessage({ content: "Write the report conclusion" }),
  ]);

  // Return the generated conclusion content
  return { conclusion: conclusion.content };
};

const finalizeReportNode = (state: typeof ResearchGraphState.State) => {
  /**
   * This is the "reduce" step where we gather all the sections,
   * combine them, and reflect on them to write the intro/conclusion
   */

  let { content, introduction, conclusion } = state;

  // Strip "## Insights" from the content if it starts with it
  if (content.startsWith("## Insights")) {
    content = content.replace("## Insights", "").trim();
  }

  // Check if content has sources section
  let sources: string | null = null;
  if (content.includes("## Sources")) {
    try {
      [content, sources] = content.split("\n## Sources\n");
    } catch (error) {
      sources = null; // Handle any splitting errors
    }
  }

  // Create the final report by combining introduction, content, and conclusion
  let finalReport = `${introduction}\n\n---\n\n${content}\n\n---\n\n${conclusion}`;

  // Append sources if they exist
  if (sources) {
    finalReport += `\n\n## Sources\n${sources}`;
  }

  return { finalReport };
};

// Define the builder using StateGraph for ResearchGraphState
const builder = new StateGraph(ResearchGraphState)
  // Add nodes
  .addNode("createAnalysts", createAnalystsNode)
  .addNode("humanFeedback", humanFeedbackNode)
  .addNode("conductInterview", graphInterviewSubGraph) // Compile the interview sub-graph
  .addNode("writeReport", writeReportNode)
  .addNode("writeIntroduction", writeIntroductionNode)
  .addNode("writeConclusion", writeConclusionNode)
  .addNode("finalizeReport", finalizeReportNode)

  // Define the logic by adding edges between nodes
  .addEdge(START, "createAnalysts")
  .addEdge("createAnalysts", "humanFeedback")
  .addConditionalEdges("humanFeedback", initiateAllInterviewsNode, [
    "createAnalysts",
    "conductInterview",
  ])
  .addEdge("conductInterview", "writeReport")
  .addEdge("conductInterview", "writeIntroduction")
  .addEdge("conductInterview", "writeConclusion")
  .addEdge(
    ["writeConclusion", "writeReport", "writeIntroduction"],
    "finalizeReport"
  )
  .addEdge("finalizeReport", END);

// Compile the graph with memory checkpointer and interrupt logic
// const memory = new MemorySaver();
export const graph = builder.compile({
  interruptBefore: ["humanFeedback"],
  // checkpointer: memory,
});

// Main function to run the whole graph in standalone mode
const main = async function () {
  console.log("Running in standalone mode...");
  const maxAnalysts = 3;
  const topic = "The benefits of adopting LangGraph as an agent framework";
  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };

  for await (const chunk of await graph.stream(
    { topic, maxAnalysts },
    config
  )) {
    // Extract the analysts from the event chunk
    const analysts = chunk.analysts || [];

    if (analysts.length > 0) {
      analysts.forEach((analyst: any) => {
        console.log(`Name: ${analyst.name}`);
        console.log(`Affiliation: ${analyst.affiliation}`);
        console.log(`Role: ${analyst.role}`);
        console.log(`Description: ${analyst.description}`);
        console.log("-".repeat(200));
      });
    }
  }
  console.log("\n====\n");
  // Once the loop finishes, we assume we've reached an interrupt
  console.log("Reached an interruption in the process.");
  console.log("Next step: handle the human feedback or continue processing.");
  let currentState = await graph.getState(config);
  console.log(currentState.next);
  console.log("\n====\n");

  // We now update the state as if we are the "humanFeedback" node
  await graph.updateState(config, {
    humanAnalystFeedback: "Add in the CEO of gen ai native startup",
    asNode: "humanFeedback",
  });

  for await (const chunk of await graph.stream(null, config)) {
    // Extract the analysts from the event chunk
    const analysts = chunk.analysts || [];

    if (analysts.length > 0) {
      analysts.forEach((analyst: any) => {
        console.log(`Name: ${analyst.name}`);
        console.log(`Affiliation: ${analyst.affiliation}`);
        console.log(`Role: ${analyst.role}`);
        console.log(`Description: ${analyst.description}`);
        console.log("-".repeat(200));
      });
    }
  }
  console.log("\n====\n");
  // Once the loop finishes, we assume we've reached an interrupt
  console.log("Reached an interruption in the process.");
  console.log("Next step: handle the human feedback or continue processing.");
  currentState = await graph.getState(config);
  console.log(currentState.next);
  console.log("\n====\n");

  // We now update the state as if we are the "humanFeedback" node
  await graph.updateState(config, {
    humanAnalystFeedback: null,
    asNode: "humanFeedback",
  });

  for await (const event of await graph.stream(null, config)) {
    console.log("--Node--");

    // Extract and print the node name (first key of the event)
    const nodeName = Object.keys(event)[0];
    console.log(nodeName);
  }
  console.log("\n====\n");
  // Once the loop finishes, we assume we've reached an interrupt
  console.log("Reached an interruption in the process.");
  console.log("Next step:");
  const finalState = await graph.getState(config);
  console.log(finalState.next);

  // Retrieve the final report from the state
  const report = finalState.values?.finalReport;
  console.log("\n====\n");
  console.log("Final Report:");
  console.log(report);
  console.log("\n====\n");
};

// Main function used to test the graphs separately
const testingMain = async function () {
  console.log("Running  in standalone mode...");

  const maxAnalysts = 3;
  const topic = "The benefits of adopting LangGraph as an agent framework";
  const config = {
    configurable: {
      thread_id: "1",
    },
    streamMode: "values" as const,
  };

  for await (const chunk of await graphAnalystsSubGraph.stream(
    { topic: topic, max_analysts: maxAnalysts },
    config
  )) {
    const analysts = chunk.analysts || [];

    if (analysts.length > 0) {
      analysts.forEach((analyst: any) => {
        console.log(`Name: ${analyst.name}`);
        console.log(`Affiliation: ${analyst.affiliation}`);
        console.log(`Role: ${analyst.role}`);
        console.log(`Description: ${analyst.description}`);
        console.log("-".repeat(50));
      });
    }

    console.log("\n====\n");
  }

  let currentState = await graphAnalystsSubGraph.getState(config);
  console.log("We are interrupted before the humanFeedback node.");
  console.log(currentState.next);

  console.log("\n====\n");

  // Update the state with human feedback, as if the update occurred in the "human_feedback" node
  await graphAnalystsSubGraph.updateState(config, {
    humanAnalystFeedback:
      "Add in someone from a startup to add an entrepreneur perspective",
    asNode: "human_feedback",
  });

  // Continue the graph execution from the interruption by passing null
  for await (const chunk of await graphAnalystsSubGraph.stream(null, config)) {
    // Review
    const analysts = chunk.analysts || [];

    if (analysts.length > 0) {
      analysts.forEach((analyst: any) => {
        console.log(`Name: ${analyst.name}`);
        console.log(`Affiliation: ${analyst.affiliation}`);
        console.log(`Role: ${analyst.role}`);
        console.log(`Description: ${analyst.description}`);
        console.log("-".repeat(200));
      });
    }
    console.log("\n====\n");
  }

  currentState = await graphAnalystsSubGraph.getState(config);
  console.log("Next node.");
  console.log(currentState.next);

  // Update the state to convey no further human feedback
  await graphAnalystsSubGraph.updateState(config, {
    humanAnalystFeedback: null,
    asNode: "humanFeedback",
  });

  // Continue the graph execution from the interruption by passing null
  for await (const chunk of await graphAnalystsSubGraph.stream(null, config)) {
    // Review
    const analysts = chunk.analysts || [];

    if (analysts.length > 0) {
      analysts.forEach((analyst: any) => {
        console.log(`Name: ${analyst.name}`);
        console.log(`Affiliation: ${analyst.affiliation}`);
        console.log(`Role: ${analyst.role}`);
        console.log(`Description: ${analyst.description}`);
        console.log("-".repeat(50));
      });
    }
    console.log("\n====\n");
  }

  currentState = await graphAnalystsSubGraph.getState(config);
  console.log("Next node.");
  console.log(currentState.next);

  const analysts = currentState.values.analysts;
  const selectedAnalyst = analysts[0];

  const messages = [
    new HumanMessage(`So you said you were writing an article on ${topic}?`),
  ];

  // Invoke the interview graph
  const interview = await graphInterviewsubGraph.invoke(
    { analyst: selectedAnalyst, messages: messages, maxNumTurns: 2 },
    config
  );

  // Access the section in the interview and render as Markdown
  const markdownContent = interview.sections[0];
  console.log(markdownContent);
};

// Conditionally run `main()` only when script is executed via tsx (not in LangGraph Studio)
// We check if the current file is being executed directly using `process.argv`
if (process.argv[1].endsWith("research-assistant.ts")) {
  main();
}
