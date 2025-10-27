"use client";

import React, { useEffect, useRef, useState } from "react";
import { Copy, Palette } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Theme } from "@/types/type";

const Available_Themes: Theme[] = [
  "default",
  "neutral",
  "dark",
  "forest",
  "base",
];

function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string>("Copy SVG");
  const [theme, setTheme] = useState<Theme | "">("");
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme) {
      setTheme(theme as Theme);
    } else {
      setTheme("default");
      localStorage.setItem("theme", "default");
    }
  }, []);

  const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const el = document.createElement("textarea");
    el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const handleCopyClick = async () => {
    const container = ref.current;
    if (!container) return;

    const svgElement = container.querySelector("svg");
    if (svgElement) {
      const svgCode = svgElement.outerHTML;
      copyToClipboard(svgCode);
      setLabel("Copied!");

      setTimeout(() => {
        setLabel("Copy SVG");
      }, 1000);
    }
  };

  // Keep a reference to the imported mermaid module so we import once per page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mermaidRef = useRef<any | null>(null);

  // Render with a small debounce to avoid re-rendering on rapid prop updates
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const render = async () => {
      const container = ref.current;
      if (chart === "" || !container || theme === "") return;
      setRenderError(null);
      container.removeAttribute("data-processed");

      try {
        // import mermaid once and cache it
        if (!mermaidRef.current) {
          const mmod = await import("mermaid");
          mermaidRef.current = mmod.default ?? mmod;
        }
        const mermaid = mermaidRef.current;

        mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme });

        if (typeof mermaid.parse === "function") {
          try {
            mermaid.parse(chart);
          } catch (parseErr: unknown) {
            console.error("Mermaid parse error:", parseErr, "Chart:", chart);
            setRenderError(
              `Syntax error: ${parseErr && parseErr instanceof Error ? parseErr.message : String(parseErr)}`
            );
            return;
          }
        }

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) container.innerHTML = svg;
      } catch {
        // Fallback: insert the raw chart and let mermaid.run process it
        container.innerHTML = `<div class="mermaid">${chart}</div>`;
        try {
          if (!mermaidRef.current) {
            const mmod = await import("mermaid");
            mermaidRef.current = mmod.default ?? mmod;
          }
          await mermaidRef.current.run({ nodes: [container] });
        } catch (e: unknown) {
          console.error(
            "Mermaid render error:",
            e,
            e instanceof Error ? e.message : undefined,
            e instanceof Error ? e.stack : undefined,
            "Chart:",
            chart
          );
          if (!cancelled) setRenderError("Failed to render diagram. The syntax may be invalid or uses unsupported features.");
        }
      }
    };

    // debounce 200ms
    timer = setTimeout(() => {
      void render();
    }, 200);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [chart, theme]);

  const handleThemeChange = async (value: Theme) => {
    setTheme(value);
    localStorage.setItem("theme", value);

    // rerender chart using already-imported mermaid module (if available)
    const container = ref.current;
    if (container && chart) {
      container.removeAttribute("data-processed");
      try {
        if (!mermaidRef.current) {
          const mmod = await import("mermaid");
          mermaidRef.current = mmod.default ?? mmod;
        }
        const mermaid = mermaidRef.current;
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: value });
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chart);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        // fallback: let the main effect handle failures on next render
        console.error("Mermaid theme render error", e);
      }
    }
  };

  return (
    <div className="w-full">
      {renderError ? (
        <div className="p-4 text-red-500 border rounded-md">
          {renderError}
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{chart}</pre>
        </div>
      ) : mounted && (
        <div ref={ref} className="mermaid flex items-center justify-center">
          {chart}
        </div>
      )}
      <div className="mt-2 px-4 py-2 text-xs font-sans flex items-center justify-center border-t">
        <Select value={theme} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-[180px] mr-2 h-8">
            <Palette className="h-4 w-4" />
            <SelectValue id="model" placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {Available_Themes.map((theme) => {
              return (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <button className="flex ml-auto gap-2" onClick={handleCopyClick}>
          <Copy className="mr-2 h-4 w-4" />
          {label}
        </button>
      </div>
    </div>
  );
}

export default React.memo(Mermaid);
