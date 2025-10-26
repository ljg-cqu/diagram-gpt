"use client";

import { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, X } from "lucide-react";

interface DiagramSelectorProps {
  selectedDiagrams: string[];
  onSelectionChange: (diagrams: string[]) => void;
}

const defaultDiagrams = [
  "architecture diagram",
  "sequence diagram",
  "data flow diagram",
  "erd diagram",
  "flowchart",
  "class diagram",
  "state diagram",
  "user journey",
  "gantt chart",
  "pie chart",
  "quadrant chart",
  "requirement diagram",
  "git graph",
  "c4 diagram",
  "mindmap",
  "timeline",
  "zenuml",
  "sankey diagram",
  "xy chart",
  "block diagram",
  "packet diagram",
  "kanban",
  "radar",
  "treemap"
];

export const DiagramSelector: React.FC<DiagramSelectorProps> = ({
  selectedDiagrams,
  onSelectionChange,
}) => {
  const [customDiagram, setCustomDiagram] = useState("");

  const toggleDiagram = (diagram: string) => {
    if (selectedDiagrams.includes(diagram)) {
      onSelectionChange(selectedDiagrams.filter(d => d !== diagram));
    } else {
      onSelectionChange([...selectedDiagrams, diagram]);
    }
  };

  const selectAll = () => {
    const allDiagrams = [...defaultDiagrams, ...selectedDiagrams.filter(d => !defaultDiagrams.includes(d))];
    onSelectionChange(allDiagrams);
  };

  const unselectAll = () => {
    onSelectionChange([]);
  };

  const addCustomDiagram = () => {
    if (customDiagram.trim() && !selectedDiagrams.includes(customDiagram.trim())) {
      onSelectionChange([...selectedDiagrams, customDiagram.trim()]);
      setCustomDiagram("");
    }
  };

  const removeCustomDiagram = (diagram: string) => {
    onSelectionChange(selectedDiagrams.filter(d => d !== diagram));
  };

  return (
    <div className="p-4 border rounded-md mb-4">
      <h3 className="text-lg font-semibold mb-2">Diagram Types</h3>
      <div className="flex gap-2 mb-4">
        <Button onClick={selectAll} variant="outline" size="sm">
          Select All
        </Button>
        <Button onClick={unselectAll} variant="outline" size="sm" title="Unselect all types to let the AI intelligently choose the most appropriate diagrams (2-9 diagrams)">
        Unselect All
        </Button>
      </div>
      <div className="space-y-2">
        {defaultDiagrams.map((diagram) => (
          <div key={diagram} className="flex items-center space-x-2">
            <Checkbox
              id={diagram}
              checked={selectedDiagrams.includes(diagram)}
              onCheckedChange={() => toggleDiagram(diagram)}
            />
            <label
              htmlFor={diagram}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
            >
              {diagram}
            </label>
          </div>
        ))}
        {selectedDiagrams.filter(d => !defaultDiagrams.includes(d)).map((diagram) => (
          <div key={diagram} className="flex items-center space-x-2">
            <Checkbox
              id={diagram}
              checked={true}
              onCheckedChange={() => toggleDiagram(diagram)}
            />
            <label
              htmlFor={diagram}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {diagram}
            </label>
            <Button
              onClick={() => removeCustomDiagram(diagram)}
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Add custom diagram type..."
          value={customDiagram}
          onChange={(e) => setCustomDiagram(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addCustomDiagram();
            }
          }}
        />
        <Button onClick={addCustomDiagram} variant="outline" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
