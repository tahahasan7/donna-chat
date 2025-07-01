const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini API - Use environment variable or fallback
const API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAif54Ai-QSbbhhBemSf5qOK4fDkI-BEus";

if (!API_KEY) {
  console.error("⚠️  GEMINI_API_KEY environment variable is not set!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// The main system prompt for Donna, the sales assistant
const SYSTEM_PROMPT = `You are Donna, a web-based chat assistant for salespeople. Your primary functions are to help them with their meetings.

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

Always wait for the user to initiate the conversation about logging notes. Do not ask to log notes proactively.`;

// Helper function to prepare chat history
const prepareChatHistory = (history) => {
  return history.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));
};

// SSE endpoint for chat
app.get("/api/chat-stream", (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send a comment to keep the connection alive
  res.write(": ping\n\n");
});

// Regular chat endpoint (non-streaming)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Message is required and must be a string" });
    }

    const formattedHistory = prepareChatHistory(history);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      systemInstruction: SYSTEM_PROMPT,
    });

    // Start a chat
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send the message and get a response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Error with Gemini API:", error);

    // Better error handling based on error type
    if (error.message?.includes("API_KEY")) {
      res.status(401).json({ error: "Invalid API key" });
    } else if (error.message?.includes("quota")) {
      res.status(429).json({ error: "API quota exceeded" });
    } else if (error.message?.includes("safety")) {
      res.status(400).json({ error: "Content filtered for safety" });
    } else {
      res.status(500).json({
        error: "Failed to process your request",
        details: error.message,
      });
    }
  }
});

// Streaming chat endpoint
app.post("/api/chat-stream", async (req, res) => {
  try {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      res.write(
        `data: ${JSON.stringify({
          error: "Message is required and must be a string",
        })}\n\n`
      );
      res.end();
      return;
    }

    const formattedHistory = prepareChatHistory(history);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      systemInstruction: SYSTEM_PROMPT,
    });

    // Start a chat
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send the message and stream the response
    const result = await chat.sendMessageStream(message);

    // Stream each chunk as it arrives
    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text();
        if (chunkText) {
          // Format for SSE
          res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
          // Flush the response to ensure the client receives it immediately
          if (res.flush) res.flush();
        }
      } catch (chunkError) {
        console.error("Error processing chunk:", chunkError);
        // Continue processing other chunks
      }
    }

    // Send end event
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error with Gemini API streaming:", error);

    // Send error through SSE format
    const errorMessage = error.message?.includes("API_KEY")
      ? "Invalid API key"
      : error.message?.includes("quota")
      ? "API quota exceeded"
      : error.message?.includes("safety")
      ? "Content filtered for safety"
      : "Failed to process your request";

    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Endpoint to get current system prompt
app.get("/api/system-prompt", (req, res) => {
  res.json({ systemPrompt: SYSTEM_PROMPT });
});

// Endpoint to update system prompt (optional - for dynamic updates)
app.post("/api/system-prompt", (req, res) => {
  const { systemPrompt } = req.body;
  if (!systemPrompt || typeof systemPrompt !== "string") {
    return res
      .status(400)
      .json({ error: "System prompt is required and must be a string" });
  }

  // Note: This would require restarting the server to persist changes
  // For persistent changes, modify the SYSTEM_PROMPT constant above
  res.json({
    message:
      "System prompt received. Modify the SYSTEM_PROMPT constant in server.cjs for persistent changes.",
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    model: "gemini-2.5-flash",
    apiKeyConfigured: !!API_KEY,
  });
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Graceful shutdown...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Graceful shutdown...");
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🌊 Streaming API: http://localhost:${PORT}/api/chat-stream`);
  console.log(`⚙️  System prompt: ${SYSTEM_PROMPT.length} characters`);
});
