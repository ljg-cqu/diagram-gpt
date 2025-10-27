"use client";

import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { useAtom } from "jotai";

import { apiKeyAtom, modelAtom, baseUrlAtom } from "@/lib/atom";
import Mermaid from "@/components/Mermaids";
import Accordion, { AccordionItem } from "@/components/Accordion";
import type { AccordionHandle } from "@/components/Accordion";
import { ChatInput } from "@/components/ChatInput";
import { CodeBlock } from "@/components/CodeBlock";
import { ChatMessage } from "@/components/ChatMessage";
import { DiagramSelector } from "@/components/DiagramSelector";
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
  const [diagramOrigins, setDiagramOrigins] = useState<number[]>([]);
  const [selectedDiagrams, setSelectedDiagrams] = useState<string[]>([
    "architecture diagram",
    "sequence diagram",
    "data flow diagram",
    "erd diagram"
  ]);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const diagramsAccordionRef = useRef<AccordionHandle | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const messagesAccordionRef = useRef<AccordionHandle | null>(null);

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
    const body: RequestBody = { messages: newMessages, model, apiKey, diagramTypes: selectedDiagrams, ...(baseUrl && { baseUrl }) };

    const response = await fetch("/api/openai", {
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
  // Associate each generated diagram with the originating message index (the message we just pushed)
  const originIndex = newMessages.length - 1;
  setDiagramOrigins(parsed.map(() => originIndex));

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

  // measure bottom fixed bar and set body padding so content is never hidden
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVar = (h: number) => {
      try {
        document.documentElement.style.setProperty('--bottom-bar-height', `${Math.ceil(h)}px`);
      } catch {}
    };

    const el = bottomBarRef.current;
    if (el) setVar(el.getBoundingClientRect().height);

    // Use a ResizeObserver so changes to bottom bar height (selector open/close) update padding
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.contentRect?.height || 0;
          setVar(h);
        }
      });
      if (el) ro.observe(el);
    } catch {
      // Fallback: listen to resize
      const onResize = () => {
        const el2 = bottomBarRef.current;
        if (el2) setVar(el2.getBoundingClientRect().height);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    return () => {
      if (ro && el) ro.unobserve(el);
    };
  }, [showSelector, outputCode.length, messages.length]);

  return (
    <main className="flex-1 w-full flex flex-col">
      {/* Messages area: each user message is foldable */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex gap-2">
          <button onClick={() => messagesAccordionRef.current?.openAll()} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span className="text-sm">Expand all</span>
          </button>
          <button onClick={() => messagesAccordionRef.current?.closeAll()} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
            <span className="text-sm">Collapse all</span>
          </button>
        </div>
        <Accordion ref={messagesAccordionRef}>
          {messages.map((message, index) => (
            <AccordionItem key={index} id={`message-${index}`} title={`User input ${index + 1}`}>
              <ChatMessage message={message.content} />
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Generated code and diagrams area. Each diagram has its own foldable group containing three foldable sections */}
      <div className="flex-1 border-t p-2 overflow-y-auto">
        <CodeBlock code={draftOutputCode} />
        <div className="mt-4">
          <div className="flex gap-2 mb-2">
            <button onClick={() => diagramsAccordionRef.current?.openAll()} className="px-2 py-1 bg-gray-100 rounded">Expand all</button>
            <button onClick={() => diagramsAccordionRef.current?.closeAll()} className="px-2 py-1 bg-gray-100 rounded">Collapse all</button>
          </div>
          <Accordion ref={diagramsAccordionRef}>
            {outputCode.map((code, index) => (
              <AccordionItem key={index} id={`diagram-${index}`} title={diagramTitles[index]}>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Origin</div>
                      <button
                        onClick={() => toggleDiagramVisibility(index)}
                        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      >
                        {visibleDiagrams[index] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="border rounded p-2 bg-white">
                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {typeof diagramOrigins[index] === 'number' && messages[diagramOrigins[index]]
                          ? messages[diagramOrigins[index]].content
                          : messages.length
                          ? messages[messages.length - 1].content
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Mermaid Syntax</div>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded">{code}</pre>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Diagram</div>
                    {diagramDescriptions[index] && (
                      <p className="text-sm text-gray-700 mb-2">{diagramDescriptions[index]}</p>
                    )}
                    {visibleDiagrams[index] && <Mermaid chart={code} />}
                  </div>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Fixed bottom area: foldable DiagramSelector above a persistent ChatInput */}
  <div ref={bottomBarRef} className="fixed left-0 right-0 bottom-0 z-30 bg-white border-t p-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowSelector(prev => !prev)}
              className="px-3 py-1 bg-gray-100 rounded"
            >
              {showSelector ? 'Hide Diagram Types' : 'Show Diagram Types'}
            </button>
            <div className="text-sm text-gray-500">Input box is fixed at bottom</div>
          </div>
          {showSelector && (
            <div className="mb-2">
              <DiagramSelector
                selectedDiagrams={selectedDiagrams}
                onSelectionChange={setSelectedDiagrams}
              />
            </div>
          )}

          <div>
            <ChatInput
              messageContent={draftMessage}
              onChange={setDraftMessage}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
