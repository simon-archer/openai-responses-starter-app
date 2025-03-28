"use client";
import React from "react";
import FileSearchSetup from "./file-search-setup";
import WebSearchConfig from "./websearch-config";
import FunctionsView from "./functions-view";
import PanelConfig from "./panel-config";
import useToolsStore from "@/stores/useToolsStore";

export default function ToolsPanel() {
  const {
    fileSearchEnabled,
    setFileSearchEnabled,
    webSearchEnabled,
    setWebSearchEnabled,
    functionsEnabled,
    setFunctionsEnabled,
  } = useToolsStore();
  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-stone-100">
        <h2 className="text-lg font-medium">Tools</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 h-full">
        <div className="space-y-5">
          <PanelConfig
            title="File Search"
            tooltip="Allows to search a knowledge base (vector store)"
            enabled={fileSearchEnabled}
            setEnabled={setFileSearchEnabled}
          >
            <FileSearchSetup />
          </PanelConfig>
          <PanelConfig
            title="Web Search"
            tooltip="Allows to search the web"
            enabled={webSearchEnabled}
            setEnabled={setWebSearchEnabled}
          >
            <WebSearchConfig />
          </PanelConfig>
          <PanelConfig
            title="Functions"
            tooltip="Allows to use locally defined functions"
            enabled={functionsEnabled}
            setEnabled={setFunctionsEnabled}
          >
            <FunctionsView />
          </PanelConfig>
        </div>
      </div>
    </div>
  );
}
