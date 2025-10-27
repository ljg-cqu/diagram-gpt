"use client";

import { useAtom } from "jotai";
import { type ChangeEvent, useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { apiKeyAtom, modelAtom, baseUrlAtom } from "@/lib/atom";
import type { Model } from "@/types/type";

export const APIKeyInput = () => {
  const [apiKey, setApiKey] = useAtom(apiKeyAtom);
  const [model, setModel] = useAtom(modelAtom);
  const [baseUrl, setBaseUrl] = useAtom(baseUrlAtom);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setApiKey(e.target.value);

  const handleBaseUrlChange = (e: ChangeEvent<HTMLInputElement>) =>
    setBaseUrl(e.target.value);

  const handleModelChange = (value: Model) => {
    setModel(value);
  };

  const fetchModels = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const base = baseUrl ? (baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`) : "https://api.openai.com/v1";
      const res = await fetch(`${base}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAvailableModels(data.data.map((m: any) => m.id).sort());
    } catch (err) {
      console.error(err);
      setAvailableModels([]);
    }
    setLoading(false);
  }, [apiKey, baseUrl]);

  useEffect(() => {
    fetchModels();
  }, [apiKey, baseUrl, fetchModels]);

  const handleSave = () => {
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("model", model);
    localStorage.setItem("baseUrl", baseUrl);
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <div>
        <Label htmlFor="api-key">OpenAI API key</Label>
        <Input
          type="password"
          id="api-key"
          placeholder="OpenAI API Key"
          value={apiKey}
          onChange={handleChange}
          className="mt-2"
        />
      </div>

      <div className="mb-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="model">Model</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchModels}
            disabled={loading || !apiKey}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Select value={model} onValueChange={handleModelChange}>
          <SelectTrigger className="w-[180px] mt-2">
            <SelectValue id="model" placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-2">
        <Label htmlFor="base-url">Base URL (optional)</Label>
        <Input
          type="text"
          id="base-url"
          placeholder="https://api.openai.com/v1"
          value={baseUrl}
          onChange={handleBaseUrlChange}
          className="mt-2"
        />
      </div>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
