import Link from "next/link";
import React, { useState } from "react";
import { Copy, HelpCircle, Edit } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// We compute the mermaid.live compressed payload on the client only via dynamic import

interface Props {
  code: string | string[];
}

export const CodeBlock = React.memo(function CodeBlock({ code }: Props) {
  const [label, setLabel] = useState<string>("Copy code");
  const [pakoHash, setPakoHash] = useState<string | null>(null);

  // Compute the mermaid.live pako: payload on the client lazily.
  React.useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      try {
        const codeStr = Array.isArray(code) ? code.join('\n\n---\n\n') : code;
        // Reuse parseCodeFromMessage to extract the pure mermaid code
        const { parseCodeFromMessage } = await import("@/lib/utils");
        const parsed = parseCodeFromMessage(codeStr);
        const finalCodeStr = parsed && parsed.length > 0 ? parsed[0].code : codeStr;

        const state = {
          code: finalCodeStr,
          mermaid: JSON.stringify({ theme: "default" }, undefined, 2),
          autoSync: true,
          updateDiagram: true,
        };

        const { deflate } = await import("pako");
        const { fromUint8Array } = await import("js-base64");

        const data = new TextEncoder().encode(JSON.stringify(state));
        const compressed = deflate(data, { level: 9 });
        const encoded = fromUint8Array(compressed, true);
        if (!cancelled) setPakoHash(encoded);
      } catch (e) {
        // Don't block rendering if this fails; just don't show the edit link
        console.error("Failed to compute mermaid.live payload:", e);
      }
    };

    // Only run on the client; effect already guarantees that.
    void compute();

    return () => {
      cancelled = true;
    };
  }, [code]);
  const copyToClipboard = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };

  const handleCopyClick = () => {
    const textToCopy = Array.isArray(code) ? code.join('\n\n---\n\n') : code;
    copyToClipboard(textToCopy);
    setLabel("Copied!");

    setTimeout(() => {
      setLabel("Copy code");
    }, 1000);
  };

  return (
    <pre>
      <div className="bg-black rounded-md mb-4">
        <div className="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md">
          <div className="flex">
            <span>mermaid</span>
            <HoverCard>
              <HoverCardTrigger>
                <HelpCircle className="mx-2 h-4 w-4 cursor-pointer" />
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Learn more about{" "}
                    <Link
                      href="https://mermaid.js.org/intro/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Mermaid syntax
                    </Link>
                    .
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="flex">
            <Link
              href={pakoHash ? `https://mermaid.live/edit#pako:${pakoHash}` : '#'}
              target={pakoHash ? '_blank' : undefined}
              rel={pakoHash ? 'noreferrer' : undefined}
              className={`flex ml-auto gap-1 mr-4 ${!pakoHash ? 'opacity-50 pointer-events-none' : ''}`}
              aria-disabled={!pakoHash}
            >
              <Edit className="h-4 w-4" /> Edit
            </Link>
            <button className="flex ml-auto gap-1" onClick={handleCopyClick}>
              <Copy className="h-4 w-4" />
              {label}
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          <code className="!whitespace-pre text-white">{Array.isArray(code) ? code.join('\n\n---\n\n') : code}</code>
        </div>
      </div>
    </pre>
  );
});

CodeBlock.displayName = 'CodeBlock';
