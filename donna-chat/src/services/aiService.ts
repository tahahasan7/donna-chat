// Define Message interface locally to avoid import issues
export interface Message {
  text: string;
  sender: "user" | "ai";
}

const API_URL = "http://localhost:3000/api";

export interface ChatResponse {
  response: string;
  error?: string;
}

export interface ChatOptions {
  systemPrompt?: string;
}

export const sendMessage = async (
  message: string,
  history: Message[],
  options?: ChatOptions
): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
        systemPrompt: options?.systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      response: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const streamMessage = (
  message: string,
  history: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  options?: ChatOptions
): (() => void) => {
  try {
    // Create EventSource for SSE
    const eventSource = new EventSource(
      `${API_URL}/chat-stream?message=${encodeURIComponent(message)}`
    );

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
        onDone();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.chunk) {
          onChunk(data.chunk);
        }
        if (data.error) {
          onError(data.error);
          eventSource.close();
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
        onError("Failed to parse response data");
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      onError("Connection error occurred");
      eventSource.close();
    };

    // Return a function to close the connection
    return () => {
      eventSource.close();
    };
  } catch (error) {
    console.error("Error setting up SSE:", error);
    onError(error instanceof Error ? error.message : "Unknown error occurred");
    return () => {}; // Return empty function as fallback
  }
};

export const sendMessageStream = async (
  message: string,
  history: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  options?: ChatOptions
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
        systemPrompt: options?.systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    // Get the reader from the response body stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is null");
    }

    // Read the stream
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onDone();
        break;
      }

      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages in the buffer
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6); // Remove 'data: ' prefix

          if (data === "[DONE]") {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e, "Raw data:", data);
            // Don't throw error for individual parsing failures
          }
        }
      }
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    onError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

// Health check function to verify server connectivity
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("Server health check failed:", error);
    return false;
  }
};

// Get current system prompt
export const getSystemPrompt = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/system-prompt`);
    if (response.ok) {
      const data = await response.json();
      return data.systemPrompt;
    }
    return null;
  } catch (error) {
    console.error("Failed to get system prompt:", error);
    return null;
  }
};

// Predefined system prompts for different use cases
export const SYSTEM_PROMPTS = {
  default: `You are Donna, a web-based chat assistant for salespeople. Your primary functions are to help them with their meetings.

Your persona should be:
- Professional, yet friendly and approachable.
- Proactive and helpful.
- Concise and clear in your communication.

You have two main capabilities:

1.  **Informing about upcoming meetings:**
    When a user asks about their next meeting, you should provide the details you have. For example: "You have a meeting at 2 PM with John Doe from Corp Corp."
    *(For this demo, since you don't have access to a real calendar, you can invent a plausible upcoming meeting if the user asks.)*

2.  **Logging meeting notes:**
    When a user wants to log notes or a report after a meeting, your job is to guide them through the process by asking a few follow-up questions. Your goal is to collect the key details of the meeting.

    Here is an example flow for logging notes:
    - **User:** "Hi Donna, I'd like to log a report of my meeting."
    - **Donna:** "Of course! Who did you have a meeting with?"
    - **User:** "With John Doe from Corp Corp. They're interested in Donna and would like to start a POC."
    - **Donna:** "Got it! How many sales reps does Corp Corp have?"
    - **User:** "[Provides number]"
    - **Donna:** "[Asks another relevant question, e.g., 'What was the main outcome or next steps?']"

    Your follow-up questions should be logical to help the salesperson capture important information for a sales context. You can ask about:
    - Key contacts.
    - Company size (e.g., number of sales reps).
    - Customer needs or pain points.
    - Interest level and budget.
    - Next steps or action items.
    - Potential roadblocks.

Always wait for the user to initiate the conversation about logging notes. Do not ask to log notes proactively.`,
};
