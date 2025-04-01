"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { CircleX, RotateCw } from "lucide-react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";
import VectorStoreService from "@/services/vector-store-service";
import { useVectorStore } from "@/components/context/vector-store-context";
import { toast } from "react-hot-toast";

export default function FileSearchSetup() {
  const { currentVectorStore, isLoading, setVectorStore, syncFiles } = useVectorStore();
  const [newStoreId, setNewStoreId] = useState<string>("");

  const unlinkStore = async () => {
    // Clear the vector store in the context
    await setVectorStore(null);
    toast.success("Vector store unlinked.");
  };

  const handleAddStore = async (storeIdInput: string) => {
    const storeId = storeIdInput.trim();
    if (!storeId) {
      toast.error("Please enter a vector store ID.");
      return;
    } 
    // Add basic validation for the ID format
    if (!storeId.startsWith('vs_')) {
        toast.error("Invalid vector store ID format. It should start with 'vs_'.");
        return;
    }
    
    try {
      console.log("[FileSearchSetup] Attempting to set vector store:", storeId);
      // Call the context function which handles fetching and syncing
      await setVectorStore(storeId); 
      // Toast success/error messages are handled within setVectorStore now
      setNewStoreId(""); // Clear input on success/attempt
    } catch (error) { 
      // Errors should be caught and handled within setVectorStore, 
      // but adding a catch here for safety.
      console.error("[FileSearchSetup] Error in setVectorStore process:", error);
      // No redundant toast here, context handles it.
    }
  };

  // Function to trigger manual sync
  const handleSyncClick = async () => {
      await syncFiles(); // Call the sync function from the context
  };

  return (
    <div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Enter an existing vector store ID to search its files.
      </div>
      <div className="flex items-center gap-2 mt-2 h-10">
        <div className="flex items-center gap-2 w-full">
          <div className="text-sm font-medium w-24 text-nowrap">
            Vector store
          </div>
          {currentVectorStore?.id ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-zinc-400 dark:text-zinc-500 text-xs font-mono flex-1 text-ellipsis truncate">
                  {currentVectorStore.id}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleX
                        onClick={unlinkStore}
                        size={16}
                        className="cursor-pointer text-zinc-400 dark:text-zinc-500 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="mr-2">
                      <p>Unlink vector store</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={handleSyncClick}
                        disabled={isLoading} // Disable while any loading/syncing is happening
                        className={`disabled:opacity-50 disabled:cursor-not-allowed`} // Basic disabled style
                      >
                        <RotateCw
                          size={16}
                          className={`cursor-pointer text-zinc-400 dark:text-zinc-500 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all ${isLoading ? 'animate-spin' : ''}`}
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
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="ID (vs_XXXX...)"
                value={newStoreId}
                onChange={(e) => setNewStoreId(e.target.value)}
                className="border border-zinc-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-gray-800 h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStore(newStoreId);
                  }
                }}
                disabled={isLoading}
              />
              <button
                className={`text-zinc-600 dark:text-zinc-300 text-sm px-2 py-1 transition-colors hover:text-zinc-800 dark:hover:text-zinc-100 cursor-pointer rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => handleAddStore(newStoreId)}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
