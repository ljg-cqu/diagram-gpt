"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";

import { apiKeyAtom, modelAtom, baseUrlAtom } from "@/lib/atom";
import Mermaid from "@/components/Mermaids";
import { ChatInput } from "@/components/ChatInput";
import { CodeBlock } from "@/components/CodeBlock";
import { ChatMessage } from "@/components/ChatMessage";
import type { Message, RequestBody } from "@/types/type";
import { parseCodeFromMessage } from "@/lib/utils";
import type { Model } from "@/types/type";

export default function Home() {
  const [apiKey, setApiKey] = useAtom(apiKeyAtom);
  const [model, setModel] = useAtom(modelAtom);
  const [baseUrl, setBaseUrl] = useAtom(baseUrlAtom);
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftOutputCode, setDraftOutputCode] = useState<string>("");
  const [outputCode, setOutputCode] = useState<string[]>([]);
  const [visibleDiagrams, setVisibleDiagrams] = useState<boolean[]>([]);
  const [diagramTitles, setDiagramTitles] = useState<string[]>([]);
  const [diagramDescriptions, setDiagramDescriptions] = useState<string[]>([]);

  useEffect(() => {
    const apiKey = localStorage.getItem("apiKey");
    const model = localStorage.getItem("model");
    const baseUrl = localStorage.getItem("baseUrl");

    if (apiKey) {
      setApiKey(apiKey);
    }
    if (model) {
      setModel(model as Model);
    }
    if (baseUrl) {
      setBaseUrl(baseUrl);
    }
  }, [setApiKey, setModel, setBaseUrl]);

  const handleSubmit = async () => {
    if (!apiKey) {
      alert("Please enter an API key.");
      return;
    }

    if (!draftMessage) {
      alert("Please enter a message.");
      return;
    }

    const newMessage: Message = {
      role: "user",
      content: draftMessage,
    };
    const newMessages = [...messages, newMessage];

    setMessages(newMessages);
    setDraftMessage("");
    setDraftOutputCode("");

    const controller = new AbortController();
    const body: RequestBody = { messages: newMessages, model, apiKey, ...(baseUrl && { baseUrl }) };

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      alert("Something went wrong.");
      return;
    }

    const data = response.body;

    if (!data) {
      alert("Something went wrong.");
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      code += chunkValue;
      setDraftOutputCode((prevCode) => prevCode + chunkValue);
    }
    const parsed = parseCodeFromMessage(code);
    const codes = parsed.map(p => p.code);
    const descriptions = parsed.map(p => p.description);
    setOutputCode(codes);
    setDiagramDescriptions(descriptions);
    setVisibleDiagrams(new Array(codes.length).fill(true));

    // Extract titles: use AI-provided titles or fall back to type detection
    const extractType = (code: string): string => {
      const lines = code.trim().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('graph')) return 'Flowchart';
        if (trimmed.match(/^%%\s*title:/i)) continue; // skip title lines
        if (trimmed.startsWith('sequenceDiagram')) return 'Sequence Diagram';
        if (trimmed.startsWith('classDiagram')) return 'Class Diagram';
        if (trimmed.startsWith('stateDiagram')) return 'State Diagram';
        if (trimmed.startsWith('erDiagram')) return 'ER Diagram';
        if (trimmed.startsWith('journey')) return 'User Journey';
        if (trimmed.startsWith('gantt')) return 'Gantt Chart';
        if (trimmed.startsWith('pie')) return 'Pie Chart';
        if (trimmed.startsWith('quadrantChart')) return 'Quadrant Chart';
        if (trimmed.startsWith('requirementDiagram')) return 'Requirement Diagram';
        if (trimmed.startsWith('gitgraph')) return 'Git Graph';
        if (trimmed.includes('C4')) return 'C4 Diagram';
        if (trimmed.startsWith('mindmap')) return 'Mindmap';
        if (trimmed.startsWith('timeline')) return 'Timeline';
        if (trimmed.startsWith('zenuml')) return 'ZenUML';
        if (trimmed.startsWith('sankey')) return 'Sankey Diagram';
        if (trimmed.startsWith('xychart')) return 'XY Chart';
        if (trimmed.startsWith('block-beta')) return 'Block Diagram';
        if (trimmed.startsWith('packet-beta')) return 'Packet Diagram';
        if (trimmed.startsWith('kanban')) return 'Kanban';
        if (trimmed.startsWith('architecture')) return 'Architecture';
        if (trimmed.startsWith('radar')) return 'Radar';
        if (trimmed.startsWith('treemap')) return 'Treemap';
      }
      return 'Diagram';
    };

    const titles = parsed.map((item, index) => {
      const title = item.title || extractType(item.code);
      return `Diagram ${index + 1}: ${title}`;
    });

    setDiagramTitles(titles);
  };

  const toggleDiagramVisibility = (index: number) => {
    setVisibleDiagrams(prev => prev.map((visible, i) => i === index ? !visible : visible));
  };

  return (
    <main className="container flex-1 w-full flex flex-wrap">
      <div className="flex border md:border-r-0 flex-col justify-between w-full md:w-1/2">
        <div className="">
          <div className="">
            {messages.map((message, index) => {
              return (
                <ChatMessage key={index} message={message.content} />
              );
            })}
          </div>
        </div>
        <div className="w-full p-2">
          <ChatInput
            messageContent={draftMessage}
            onChange={setDraftMessage}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
      <div className="border w-full md:w-1/2 p-2 flex flex-col">
        <CodeBlock code={draftOutputCode} />

        <div className="flex-1 border relative overflow-y-auto">
          {outputCode.map((code, index) => (
          <div key={index} className="mb-4 border rounded p-2">
          <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{diagramTitles[index]}</h3>
          <button
          onClick={() => toggleDiagramVisibility(index)}
          className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
          {visibleDiagrams[index] ? 'Hide' : 'Show'}
          </button>
          </div>
          {diagramDescriptions[index] && (
            <p className="text-sm text-gray-700 mb-2">{diagramDescriptions[index]}</p>
          )}
          {visibleDiagrams[index] && <Mermaid chart={code} />}
          </div>
          ))}
        </div>
      </div>
    </main>
  );
}
