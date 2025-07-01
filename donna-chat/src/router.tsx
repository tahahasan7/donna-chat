import type { ActionFunctionArgs } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ChatPage from "./pages/ChatPage";
import ErrorPage from "./pages/ErrorPage";

// Loader example - could fetch data from an API
export async function appLoader() {
  // This could be an API call in a real app
  return {
    welcomeMessage: "Welcome to Donna Chat Assistant",
    suggestedPrompts: [
      "Tell me about my next meeting",
      "What's on my calendar today?",
    ],
  };
}

// Action example - handles form submissions
export async function sendMessageAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const message = formData.get("message");

  if (!message || typeof message !== "string" || message.trim() === "") {
    return { error: "Message cannot be empty" };
  }

  // In a real app, this would send the message to an API
  // For now, we'll just return the message and a mock response
  return {
    userMessage: message,
    aiResponse: `This is a response to: "${message}"`,
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: appLoader,
    errorElement: <ErrorPage />,
    id: "root",
    children: [
      {
        index: true,
        element: <ChatPage />,
        action: sendMessageAction,
        errorElement: <ErrorPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
        action: sendMessageAction,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);
