"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useVectorStore } from "./vector-store-context";
import useToolsStore from "@/stores/useToolsStore";

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
  
  // Get the current vector store state
  const { currentVectorStore } = useVectorStore();
  
  // Use state from tools store
  const { 
    webSearchEnabled, setWebSearchEnabled,
    fileSearchEnabled, setFileSearchEnabled,
    functionsEnabled, setFunctionsEnabled,
    setVectorStore: setToolsVectorStore,
    resetStore
  } = useToolsStore();
  
  // Initialize tools based on vector store connection
  useEffect(() => {
    console.log("[ToolsContext] Checking vector store connection on init:", currentVectorStore?.id);
    if (currentVectorStore?.id) {
      console.log("[ToolsContext] Vector store connected on init, enabling file search");
      // Enable file search and update the tools store with the vector store details
      setFileSearchEnabled(true);
      setToolsVectorStore({
        id: currentVectorStore.id,
        name: currentVectorStore.name || "Connected Store"
      });
    } else {
      console.log("[ToolsContext] No vector store on init, file search disabled");
      // Ensure file search is disabled if no vector store connected
      if (fileSearchEnabled) {
        setFileSearchEnabled(false);
      }
    }
  }, [currentVectorStore, setFileSearchEnabled, setToolsVectorStore, fileSearchEnabled]);

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