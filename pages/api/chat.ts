import { OpenAIStream } from "@/lib/utils";
import { type RequestBody } from "@/types/type";

export const config = {
  runtime: "edge",
};

export default async function chat(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json() as RequestBody;

    // Basic validation
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response("Invalid messages", { status: 400 });
    }

    if (!body.apiKey || typeof body.apiKey !== "string") {
      return new Response("Invalid API key", { status: 400 });
    }

    if (!body.model || typeof body.model !== "string") {
      return new Response("Invalid model", { status: 400 });
    }

    const { messages, model, apiKey, diagramTypes, baseUrl } = body;

    const stream = await OpenAIStream(messages, model, apiKey, diagramTypes, baseUrl);

    return new Response(stream);
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
