import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import endent from "endent";
import { deflate } from "pako";
import { fromUint8Array } from "js-base64";

import { type Message } from "@/types/type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const systemPrompt = (diagramTypes: string[], userMessage: string) => {
  const typesText = diagramTypes.length > 0 ? diagramTypes.join(', ') : 'various diagram types';
if (diagramTypes.length === 0) {
    const escapedMessage = userMessage.replace(/"/g, '\\"').replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
    return endent`
You are an assistant to help user build diagrams with Mermaid.
The user has not selected any specific diagram types. Analyze the user's description carefully: "${escapedMessage}".
Determine the most appropriate diagram types that would best represent the content and concepts described.
Generate diagrams for the determined types. Aim for 2-9 relevant diagrams that provide comprehensive coverage.

For each diagram, provide the response in this exact format:
%% title: Meaningful Title %%
Description: Brief description of the diagram (1-2 sentences).

\`\`\`mermaid
[Mermaid diagram code here]
\`\`\`

IMPORTANT:
- Put the title and description BEFORE the mermaid code block
- Do NOT put any text inside the \`\`\`mermaid code block except valid Mermaid syntax
- The description should be on its own line after "Description:"
`;
  } else {
    return endent`
You are an assistant to help user build diagrams with Mermaid.
The user has selected the following diagram types to generate: ${typesText}.
Generate ONE diagram for EACH selected type. Do not generate any additional diagrams beyond what was requested.
If a selected type doesn't make sense for the user's description, still create a diagram that fits the type as closely as possible.

IMPORTANT: When generating Data Flow Diagrams (DFD), use Mermaid's flowchart syntax, NOT a 'dfd' diagram type. Use 'flowchart TD' or 'flowchart LR' and represent processes, data stores, external entities, and data flows using appropriate node shapes and arrow connections.

For each diagram, provide the response in this exact format:
%% title: Meaningful Title %%
Description: Brief description of the diagram (1-2 sentences).

\`\`\`mermaid
[Mermaid diagram code here]
\`\`\`

IMPORTANT:
- Put the title and description BEFORE the mermaid code block
- Do NOT put any text inside the \`\`\`mermaid code block except valid Mermaid syntax
- The description should be on its own line after "Description:"
`;
  }
};

export const OpenAIStream = async (
messages: Message[],
model: string,
key: string,
diagramTypes: string[],
baseUrl?: string
) => {
const userMessage = messages[messages.length - 1]?.content || '';
  const system = { role: "system", content: systemPrompt(diagramTypes, userMessage) };
  const base = baseUrl ? (baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`) : "https://api.openai.com/v1";
  const res = await fetch(`${base}/chat/completions`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key || process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model,
      messages: [system, ...messages],
      temperature: 0,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const statusText = res.statusText;
    const result = await res.body?.getReader().read();
    throw new Error(
      `OpenAI API returned an error: ${
        decoder.decode(result?.value) || statusText
      }`
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

export const parseCodeFromMessage = (message: string): { title: string; description: string; code: string }[] => {
  // Split the message by ``` to find code blocks and their preceding content
  const parts = message.split(/```/);
  const results: { title: string; description: string; code: string }[] = [];

  for (let i = 0; i < parts.length - 1; i += 2) {
    const beforeCode = parts[i];
    const codeBlock = parts[i + 1];

    // Extract title from the content before the code block or at the start of code
    let title = '';
    let titleMatch = beforeCode.match(/%%\s*title:\s*(.+?)(?:\s*%%)?(?=\n|$)/i);
    if (!titleMatch) {
      titleMatch = codeBlock.match(/%%\s*title:\s*(.+?)(?:\s*%%)?(?=\n|$)/i);
    }
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract description: look for "Description:" in beforeCode or at the start of codeBlock
    let description = '';
    let descStart = beforeCode.indexOf('Description:');
    let descText = '';

    if (descStart !== -1) {
      descText = beforeCode.substring(descStart + 'Description:'.length).trim();
    } else {
      // Check if description is at the start of the code block
      const codeDescStart = codeBlock.indexOf('Description:');
      if (codeDescStart !== -1 && codeDescStart < 100) { // Only if it's near the beginning
        descText = codeBlock.substring(codeDescStart + 'Description:'.length).trim();
      }
    }

    if (descText) {
      const endIndex = descText.indexOf('\n\n');
      if (endIndex !== -1) {
        description = descText.substring(0, endIndex).trim();
      } else {
        description = descText.split('\n')[0].trim(); // Take only the first line
      }
    }

    // Extract the mermaid code (remove 'mermaid' prefix, title comments, and description if present)
    let code = codeBlock.replace(/^mermaid\s*/, '').trim();
    code = code.replace(/^%%.*title:.*$/gm, '').trim();
    code = code.replace(/^Description:.*$/gm, '').trim();

    if (code) {
      results.push({ title, description, code });
    }
  }

  // If no structured blocks found, try the old way as fallback
  if (results.length === 0) {
    const regex = /```(?:mermaid)?\s*([\s\S]*?)```/g;
    const matches = Array.from(message.matchAll(regex));
    return matches.map(match => ({ title: '', description: '', code: match[1] }));
  }

  return results;
};

export const serializeCode = (code: string | string[]) => {
  const codeStr = Array.isArray(code) ? code.join('\n\n---\n\n') : code;
  const parsed = parseCodeFromMessage(codeStr);
  const finalCode = Array.isArray(parsed) ? parsed[0] : parsed;

  const state = {
    code: finalCode,
    mermaid: JSON.stringify(
      {
        theme: "default",
      },
      undefined,
      2
    ),
    autoSync: true,
    updateDiagram: true,
  };
  const data = new TextEncoder().encode(JSON.stringify(state));
  const compressed = deflate(data, { level: 9 });
  return fromUint8Array(compressed, true);
};
