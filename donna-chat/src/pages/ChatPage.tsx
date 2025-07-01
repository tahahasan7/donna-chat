import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import {
  sendMessageStream,
  SYSTEM_PROMPTS,
  type Message,
} from "../services/aiService";
import type { AppLoaderData } from "../types";

interface ActionData {
  error?: string;
  userMessage?: string;
  aiResponse?: string;
}

function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const actionData = useActionData() as ActionData | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const { welcomeMessage, suggestedPrompts } =
    useOutletContext<AppLoaderData>();

  useEffect(() => {
    if (searchParams.get("newChat")) {
      setMessages([]);
      setMessage("");
      setCharCount(0);
      setIsStreaming(false);
      setStreamingMessage("");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      handleSendToAI(urlPrompt);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(
        new Event("submit") as unknown as FormEvent<HTMLFormElement>
      );
    }
  };

  const handleSendToAI = async (userMessage: string) => {
    const updatedMessages: Message[] = [
      ...messages,
      { text: userMessage, sender: "user" },
    ];
    setMessages(updatedMessages);

    setMessage("");
    setCharCount(0);

    const textarea = document.querySelector(
      ".chat-input"
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
    }

    setIsStreaming(true);
    setStreamingMessage("");

    let accumulatedMessage = "";

    try {
      await sendMessageStream(
        userMessage,
        updatedMessages,
        (chunk) => {
          accumulatedMessage += chunk;
          setStreamingMessage(accumulatedMessage);
        },
        () => {
          setMessages((prev) => [
            ...prev,
            { text: accumulatedMessage, sender: "ai" },
          ]);
          setStreamingMessage("");
          setIsStreaming(false);
        },
        (error) => {
          console.error("Streaming error:", error);
          setMessages((prev) => [
            ...prev,
            { text: `Error: ${error}`, sender: "ai" },
          ]);
          setStreamingMessage("");
          setIsStreaming(false);
        },
        { systemPrompt: SYSTEM_PROMPTS.default }
      );
    } catch (error) {
      console.error("Failed to start streaming:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error: Failed to connect to AI service", sender: "ai" },
      ]);
      setStreamingMessage("");
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (message.trim() && !isStreaming) {
      handleSendToAI(message);
    }
  };

  return (
    <div className="chat-page-container">
      {messages.length > 0 || isStreaming ? (
        <div className="message-list" ref={chatContentRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {isStreaming && streamingMessage && (
            <div className="message-bubble ai streaming">
              {streamingMessage}
              <span className="streaming-cursor"></span>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-welcome">
          <div className="chat-header">
            <div className="chat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M12 2.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75zM12 18a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75zM5.25 12a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75zM15 12a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75zM7.05 7.05a.75.75 0 0 1 1.06 0l2.122 2.121a.75.75 0 0 1-1.06 1.06L7.05 8.11a.75.75 0 0 1 0-1.06zm9.9 9.9a.75.75 0 0 1 1.06 0l2.121 2.121a.75.75 0 1 1-1.06 1.06l-2.121-2.12a.75.75 0 0 1 0-1.061zM16.95 7.05a.75.75 0 0 1 0 1.06l-2.121 2.121a.75.75 0 0 1-1.06-1.06l2.12-2.121a.75.75 0 0 1 1.061 0zm-9.9 9.9a.75.75 0 0 1 0 1.06l-2.121 2.12a.75.75 0 0 1-1.06-1.06l2.12-2.121a.75.75 0 0 1 1.06 0z" />
              </svg>
            </div>
            <h1>{welcomeMessage}</h1>
            <p className="chat-subtitle">
              Choose a prompt below or write your own to start chatting with
              Donna
            </p>
          </div>

          <div className="prompt-section">
            <div className="prompt-buttons">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="prompt-button"
                  onClick={() => handleSendToAI(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="chat-input-area">
        <Form
          ref={formRef}
          method="post"
          className="chat-input-container"
          onSubmit={handleSubmit}
        >
          <textarea
            name="message"
            className="chat-input"
            placeholder="Ask me anything"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            disabled={isStreaming}
          />
          <div className="chat-input-actions">
            <span className="char-count">{charCount}/2000</span>
            <button
              type="submit"
              className="send-button"
              disabled={!message.trim() || isStreaming}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </Form>
      </footer>
    </div>
  );
}

export default ChatPage;
