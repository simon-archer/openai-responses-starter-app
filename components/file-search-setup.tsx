"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { CircleX, RotateCw, Copy, Check } from "lucide-react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";
import VectorStoreService from "@/services/vector-store-service";
import { useVectorStore } from "@/components/context/vector-store-context";
import { toast } from "react-hot-toast";

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
  const [newStoreId, setNewStoreId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const unlinkStore = async () => {
    await setVectorStore(null);
    toast.success("Vector store unlinked.");
  };

  const handleAddStore = async (storeIdInput: string) => {
    const storeId = storeIdInput.trim();
    if (!storeId) {
      toast.error("Please enter a vector store ID.");
      return;
    } 
    if (!storeId.startsWith('vs_')) {
        toast.error("Invalid vector store ID format. It should start with 'vs_'.");
        return;
    }
    
    try {
      console.log("[FileSearchSetup] Attempting to set vector store:", storeId);
      await setVectorStore(storeId); 
      setNewStoreId("");
    } catch (error) { 
      console.error("[FileSearchSetup] Error in setVectorStore process:", error);
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

  return (
    <div>
      <div className="flex items-center gap-2 h-10 mb-2">
        <div className="flex items-center gap-2 w-full">
          <div className="text-sm font-medium w-24 text-nowrap shrink-0">
            Vector store
          </div>
          {currentVectorStore?.id ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
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
                        disabled={isLoading}
                        className={`disabled:opacity-50 disabled:cursor-not-allowed`}
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

      {currentVectorStore && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 pl-1 mt-1">
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
      )}
    </div>
  );
}
