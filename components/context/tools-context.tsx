"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";

interface ToolsContextType {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  fileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export const useTools = () => {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error("useTools must be used within a ToolsProvider");
  }
  return context;
};

export const ToolsProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTool, setSelectedTool] = useState<string>("websearch");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [fileSearchEnabled, setFileSearchEnabled] = useState(false);
  const [functionsEnabled, setFunctionsEnabled] = useState(false);

  return (
    <ToolsContext.Provider
      value={{
        selectedTool,
        setSelectedTool,
        webSearchEnabled,
        setWebSearchEnabled,
        fileSearchEnabled,
        setFileSearchEnabled,
        functionsEnabled,
        setFunctionsEnabled
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
}; 