"use client";
import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { CircleX, RotateCw, Copy, Check } from "lucide-react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";
import VectorStoreService from "@/services/vector-store-service";
import { useVectorStore } from "@/components/context/vector-store-context";
import { toast } from "react-hot-toast";
import useToolsStore from "@/stores/useToolsStore";

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileSearchSetup() {
  const { currentVectorStore, isLoading, setVectorStore, syncFiles } = useVectorStore();
  
  const { 
    setVectorStore: setToolsVectorStore, 
    setFileSearchEnabled,
    resetStore 
  } = useToolsStore();
  
  const [inputValue, setInputValue] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [mode, setMode] = useState<'connect' | 'create' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reset the tools store on initial load to start with a clean state
  useEffect(() => {
    console.log("[FileSearchSetup] Initial mount, resetting tools store");
    resetStore();
  }, [resetStore]);

  // Synchronize the tools store with the vector store context
  useEffect(() => {
    console.log("[FileSearchSetup] Syncing tools store with vector store:", currentVectorStore?.id);
    
    if (currentVectorStore?.id) {
      // Vector store is connected, enable file search and update the store
      setFileSearchEnabled(true);
      
      // Update the tools store with the vector store data
      setToolsVectorStore({
        id: currentVectorStore.id,
        name: currentVectorStore.name || "Connected Store",
        // Include any other properties needed by the tools store
      });
      
      console.log("[FileSearchSetup] Vector store synced to tools store, file search enabled");
    } else {
      // Vector store is disconnected, disable file search
      setFileSearchEnabled(false);
      
      // For null case, create an empty vector store with empty ID
      setToolsVectorStore({
        id: "",
        name: ""
      });
      
      console.log("[FileSearchSetup] Vector store disconnected from tools store, file search disabled");
    }
  }, [currentVectorStore, setFileSearchEnabled, setToolsVectorStore]);

  const unlinkStore = async () => {
    setIsActionLoading(true);
    try {
        // Reset the tools store before unlinking to ensure clean state
        resetStore();
        await setVectorStore(null);
        toast.success("Vector store unlinked.");
    } catch (error) {
        console.error("[FileSearchSetup] Error unlinking store:", error);
        toast.error("Failed to unlink store.");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleConnectStore = async () => {
    const storeId = inputValue.trim();
    if (!storeId) {
      toast.error("Please enter a vector store ID.");
      return;
    } 
    if (!storeId.startsWith('vs_')) {
        toast.error("Invalid vector store ID format. It should start with 'vs_'.");
        return;
    }
    setIsActionLoading(true);
    try {
      // Reset the tools store before connecting to ensure clean state
      resetStore();
      await setVectorStore(storeId); 
      setInputValue(""); 
      setMode(null);
    } catch (error) { 
      console.error("[FileSearchSetup] Error in setVectorStore process:", error);
    } finally {
        setIsActionLoading(false);
    }
  };
  
  const handleCreateStore = async () => {
    const storeName = inputValue.trim();
    if (!storeName) {
        toast.error("Please enter a name for the new vector store.");
        return;
    }
    setIsActionLoading(true);
    try {
        // Reset the tools store before creating a new one
        resetStore();
        console.log("[FileSearchSetup] Creating new vector store with name:", storeName);
        const createResponse = await fetch("/api/vector_stores/create_store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeName }),
        });
        if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            throw new Error(`Error creating vector store: ${createResponse.statusText} ${JSON.stringify(errorData)}`);
        }
        const createData = await createResponse.json();
        const newStoreId = createData.id;
        if (!newStoreId) {
            throw new Error("Vector Store ID not received after creation.");
        }
        toast.success(`Store '${storeName}' created! Connecting...`);
        await setVectorStore(newStoreId);
        setInputValue("");
        setMode(null);
    } catch (error) {
        console.error("[FileSearchSetup] Failed to create vector store:", error);
        toast.error(`Failed to create store: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleSyncClick = async () => {
      await syncFiles();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Vector Store ID copied!");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      toast.error("Failed to copy ID.");
      console.error('Could not copy text: ', err);
    });
  };

  useEffect(() => {
      if (currentVectorStore?.id) {
          setMode(null); 
      } else {
          // Optional: Reset to null when unlinked if desired, 
          // or keep the last selected mode buttons visible.
          // setMode(null); 
      }
  }, [currentVectorStore?.id]);

  return (
    <div>
      {/* Show controls only if NO store is connected */}
      {!currentVectorStore?.id && (
        <div className="space-y-2">
          {/* Mode Toggle Buttons - Adjusted Styling */} 
          <div className="flex items-center gap-2 pt-2 text-sm">
             <button 
                onClick={() => setMode('connect')} 
                className={`px-2 py-1 rounded border transition-colors 
                            ${mode === 'connect' 
                                ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 font-medium' 
                                : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading || isActionLoading}
            >
                Connect Existing
             </button>
             <button 
                onClick={() => setMode('create')} 
                className={`px-2 py-1 rounded border transition-colors 
                            ${mode === 'create' 
                                ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 font-medium' 
                                : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading || isActionLoading}
            >
                 Create New
             </button>
          </div>

          {/* Conditional Input/Button - Render only if mode is selected */} 
          {mode === 'connect' && (
            <div className="flex items-center gap-2">
              {/* Connect Input/Button */}
              <Input
                type="text"
                placeholder="Enter existing ID (vs_...)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border border-zinc-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-gray-800 h-8 flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { handleConnectStore(); } }}
                disabled={isLoading || isActionLoading}
                autoFocus
              />
              <button
                className={`text-zinc-600 dark:text-zinc-300 text-sm px-2 py-1 transition-colors hover:text-zinc-800 dark:hover:text-zinc-100 cursor-pointer rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                onClick={handleConnectStore}
                disabled={isLoading || isActionLoading || !inputValue.trim().startsWith('vs_')}
              >
                {isActionLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
           )}
           
          {mode === 'create' && (
             <div className="flex items-center gap-2">
               {/* Create Input/Button */}
               <Input
                type="text"
                placeholder="Enter name for new store"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border border-zinc-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-gray-800 h-8 flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { handleCreateStore(); } }}
                disabled={isLoading || isActionLoading}
                autoFocus
              />
              <button
                className={`text-zinc-600 dark:text-zinc-300 text-sm px-2 py-1 transition-colors hover:text-zinc-800 dark:hover:text-zinc-100 cursor-pointer rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
                onClick={handleCreateStore}
                disabled={isLoading || isActionLoading || !inputValue.trim()}
              >
                {isActionLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Display Connected Store Info (Only if connected) */} 
      {currentVectorStore?.id && (
        <div> {/* Wrap connected info */} 
            <div className="flex items-center gap-2 h-10">
                <div className="flex items-center gap-2 w-full">
                <div className="text-sm font-medium text-nowrap shrink-0">
                    Vector store
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Clickable ID */}
                        <TooltipProvider>
                           <Tooltip>
                                <TooltipTrigger asChild>
                                    <div 
                                        className="group flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-mono flex-1 text-ellipsis truncate cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 px-1.5 py-0.5 rounded transition-colors"
                                        onClick={() => copyToClipboard(currentVectorStore.id)}
                                    >
                                        {isCopied ? (
                                            <Check size={12} className="flex-shrink-0 text-green-500" />
                                        ) : (
                                            <Copy size={12} className="flex-shrink-0 opacity-70 group-hover:opacity-100" />
                                        )}
                                        <span className="truncate">{currentVectorStore.id}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isCopied ? "Copied!" : "Click to copy ID"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Unlink Button */}
                        <TooltipProvider>
                           <Tooltip>
                                <TooltipTrigger asChild>
                                <CircleX
                                    onClick={unlinkStore}
                                    size={16}
                                    className={`cursor-pointer text-zinc-400 dark:text-zinc-500 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                </TooltipTrigger>
                                <TooltipContent className="mr-2">
                                <p>Unlink vector store</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {/* Refresh/Sync Button */}
                        <TooltipProvider>
                           <Tooltip>
                                <TooltipTrigger asChild>
                                <button 
                                    onClick={handleSyncClick}
                                    disabled={isLoading || isActionLoading}
                                    className={`disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <RotateCw
                                    size={16}
                                    className={`cursor-pointer text-zinc-400 dark:text-zinc-500 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`}
                                    />
                                </button>
                                </TooltipTrigger>
                                <TooltipContent className="mr-2">
                                <p>Refresh file list from vector store</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                </div>
            </div>

            {/* Additional Store Info Section */} 
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1"> 
            {currentVectorStore.name && ( 
                <div><strong>Name:</strong> {currentVectorStore.name}</div>
            )}
            {currentVectorStore.status && (
                <div><strong>Status:</strong> <span className={`font-medium ${currentVectorStore.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{currentVectorStore.status}</span></div>
            )}
            {currentVectorStore.file_counts && (
                <div><strong>Files:</strong> {currentVectorStore.file_counts.completed} completed / {currentVectorStore.file_counts.total} total</div>
            )}
            {currentVectorStore.usage_bytes !== undefined && (
                <div><strong>Usage:</strong> {formatBytes(currentVectorStore.usage_bytes)}</div>
            )}
            </div>
        </div>
      )}
    </div>
  );
}
