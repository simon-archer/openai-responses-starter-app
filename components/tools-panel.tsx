"use client";
import React, { useState } from "react";
import PanelConfig from "./panel-config";
import WebSearchConfig from "./websearch-config";
import FileSearchSetup from "./file-search-setup";
import FunctionsView from "./functions-view";

export default function ToolsPanel() {
  const [selectedTool, setSelectedTool] = useState<string>("websearch");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [fileSearchEnabled, setFileSearchEnabled] = useState(false);
  const [functionsEnabled, setFunctionsEnabled] = useState(false);

  const toolOptions = [
    { id: "websearch", label: "Web" },
    { id: "file-search", label: "Files" },
    { id: "functions", label: "Funcs" }
  ];

  const renderToolContent = () => {
    switch (selectedTool) {
      case "websearch":
        return (
          <PanelConfig
            title="Web Search"
            tooltip="Allows to search the web"
            enabled={webSearchEnabled}
            setEnabled={setWebSearchEnabled}
          >
            <WebSearchConfig />
          </PanelConfig>
        );
      case "file-search":
        return (
          <PanelConfig
            title="File Search"
            tooltip="Allows to search a knowledge base"
            enabled={fileSearchEnabled}
            setEnabled={setFileSearchEnabled}
          >
            <FileSearchSetup />
          </PanelConfig>
        );
      case "functions":
        return (
          <PanelConfig
            title="Functions"
            tooltip="Allows to use locally defined functions"
            enabled={functionsEnabled}
            setEnabled={setFunctionsEnabled}
          >
            <FunctionsView />
          </PanelConfig>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="p-2 border-b">
        {/* Simple segmented control */}
        <div className="flex rounded-md overflow-hidden border border-gray-200 divide-x divide-gray-200">
          {toolOptions.map(option => (
            <button
              key={option.id}
              className={`
                flex-1 py-1.5 text-xs transition-colors
                ${selectedTool === option.id
                  ? "bg-gray-100 text-black font-medium"
                  : "bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
              onClick={() => setSelectedTool(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto">
        {renderToolContent()}
      </div>
    </div>
  );
}
