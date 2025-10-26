export type Model = string;

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RequestBody {
  messages: Message[];
  model: Model;
  apiKey: string;
  diagramTypes: string[];
  baseUrl?: string;
}

export type Theme = "default" | "neutral" | "dark" | "forest" | "base";
