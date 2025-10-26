"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { Copy, Palette } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Theme } from "@/types/type";

interface MermaidProps {
  chart: string;
}

const Available_Themes: Theme[] = [
  "default",
  "neutral",
  "dark",
  "forest",
  "base",
];

export default function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string>("Copy SVG");
  const [theme, setTheme] = useState<Theme | "">("");

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
  } catch (err) {
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

  const drawChart = useCallback(async (chart: string, theme: Theme | "") => {
    const container = ref.current;
    if (chart !== "" && container && theme !== "") {
      container.removeAttribute("data-processed");
      mermaid.mermaidAPI.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme,
      logLevel: 5,
      });
      await mermaid.run();
    }
  }, []);

  useEffect(() => {
    drawChart(chart, theme);
  }, [chart, theme, drawChart]);

  const handleThemeChange = async (value: Theme) => {
    setTheme(value);
    localStorage.setItem("theme", value);

    // rerender chart
    const container = ref.current;
    if (container) {
      container.removeAttribute("data-processed");
      mermaid.mermaidAPI.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: value,
      logLevel: 5,
      });
      const { svg } = await mermaid.mermaidAPI.render("id", chart);
      if (ref.current) {
        ref.current.innerHTML = svg;
      }
    }
  };

  return (
    <div className="w-full">
      {mounted && (
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
