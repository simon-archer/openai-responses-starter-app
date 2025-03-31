"use client";
import React from "react";
import PanelConfig from "./panel-config";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import { useTools } from "./context/tools-context";

export default function ToolsPanel() {
  const {
    selectedTool,
    setSelectedTool,
    webSearchEnabled,
    setWebSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled
  } = useTools();

  const toolOptions = [
    { id: "websearch", label: "Web" },
    { id: "functions", label: "Funcs" }
  ];

  React.useEffect(() => {
    if (selectedTool === "file-search") {
      setSelectedTool("websearch");
    }
  }, [selectedTool, setSelectedTool]);

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
        if (!toolOptions.some(opt => opt.id === selectedTool)) {
           return <p className="text-sm text-gray-500 p-4">Select a tool above.</p>;
        }
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="p-2 border-b">
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
