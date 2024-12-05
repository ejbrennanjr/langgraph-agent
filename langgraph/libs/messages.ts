import { AIMessage, HumanMessage } from "@langchain/core/messages";

// Helper function to safely log messages and handle tool_calls for AIMessage
export function printMessages(messages: (AIMessage | HumanMessage)[]) {
  console.dir(
    messages.map((msg) => {
      // Check if the message is an instance of AIMessage and handle tool_calls
      if (msg instanceof AIMessage) {
        return {
          id: msg.id,
          type: msg._getType(),
          content: msg.content,
          tool_calls: msg.tool_calls || [], // Safely handle tool_calls
        };
      }
      // For HumanMessage, just return the common fields
      return {
        id: msg.id,
        type: msg._getType(),
        content: msg.content,
      };
    }),
    { depth: null } // Log the object with unlimited depth
  );
}
