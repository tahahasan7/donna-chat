export interface Message {
  text: string;
  sender: "user" | "ai";
}

export interface AppLoaderData {
  welcomeMessage: string;
  suggestedPrompts: string[];
}
