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

const systemPrompt = endent`
  You are an assistant to help user build diagrams with Mermaid.
  Return one or more Mermaid code blocks wrapped in \`\`\`mermaid ... \`\`\`.
  For each diagram, include a title comment at the top like %% title: Meaningful Title %%.
  Do not include descriptions or extra text outside the code blocks.
  `;

export const OpenAIStream = async (
  messages: Message[],
  model: string,
  key: string,
  baseUrl?: string
) => {
  const system = { role: "system", content: systemPrompt };
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

export const parseCodeFromMessage = (message: string): { title: string; code: string }[] => {
  // Split the message by ``` to find code blocks and their preceding content
  const parts = message.split(/```/);
  const results: { title: string; code: string }[] = [];

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

    // Extract the mermaid code (remove 'mermaid' prefix and title comments if present)
    let code = codeBlock.replace(/^mermaid\s*/, '').trim();
    code = code.replace(/^%%.*title:.*$/gm, '').trim();

    if (code) {
      results.push({ title, code });
    }
  }

  // If no structured blocks found, try the old way as fallback
  if (results.length === 0) {
    const regex = /```(?:mermaid)?\s*([\s\S]*?)```/g;
    const matches = Array.from(message.matchAll(regex));
    return matches.map(match => ({ title: '', code: match[1] }));
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
