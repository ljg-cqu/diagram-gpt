import { OpenAIStream } from "@/lib/utils";
import { type RequestBody } from "@/types/type";

export const runtime = "edge";

export async function POST(req: Request) {
try {
const { messages, model, apiKey, diagramTypes, baseUrl } = (await req.json()) as RequestBody;

    if (!diagramTypes || diagramTypes.length === 0) {
      return new Response("At least one diagram type must be selected", { status: 400 });
    }

const stream = await OpenAIStream(messages, model, apiKey, diagramTypes, baseUrl);

return new Response(stream);
} catch (error) {
console.error(error);
return new Response("Error", { status: 500 });
}
}
