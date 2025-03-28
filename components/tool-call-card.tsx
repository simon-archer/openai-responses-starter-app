"use client";

import React from "react";
import { Search, FileSearch, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallCardProps {
  type: string;
  status: string;
  output?: string;
}

export default function ToolCallCard({ type, status, output }: ToolCallCardProps) {
  // Get the appropriate icon based on tool type
  const getIcon = () => {
    switch (type) {
      case "web_search_call":
        return <Search className="h-4 w-4 text-blue-500" />;
      case "file_search_call":
        return <FileSearch className="h-4 w-4 text-amber-500" />;
      default:
        return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format the tool type for display
  const getDisplayType = () => {
    switch (type) {
      case "web_search_call":
        return "Web Search";
      case "file_search_call":
        return "File Search";
      default:
        return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }
  };

  // Parse and format the output
  const getFormattedOutput = () => {
    if (!output) return null;
    try {
      const parsedOutput = JSON.parse(output);
      if (Array.isArray(parsedOutput)) {
        return parsedOutput.map((item, index) => (
          <div key={index} className="text-sm text-gray-600 mt-2">
            {item.file && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileSearch className="h-3 w-3" />
                <span className="font-mono">{item.file}</span>
              </div>
            )}
            {item.content && (
              <div className="mt-1 pl-5 border-l-2 border-gray-200">
                {item.content.length > 200 ? 
                  `${item.content.substring(0, 200)}...` : 
                  item.content
                }
              </div>
            )}
          </div>
        ));
      }
      return <pre className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{JSON.stringify(parsedOutput, null, 2)}</pre>;
    } catch {
      return <div className="text-sm text-gray-600 mt-2">{output}</div>;
    }
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 shadow-sm transition-all",
      status === "completed" ? "border-gray-200" : "border-blue-200 bg-blue-50/50"
    )}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium">{getDisplayType()}</span>
        <span className="text-xs text-gray-500 ml-auto">
          {status === "completed" ? "Completed" : "Processing..."}
        </span>
      </div>
      {getFormattedOutput()}
    </div>
  );
} 