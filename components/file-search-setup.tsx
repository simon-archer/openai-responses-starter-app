"use client";
import React, { useState, useEffect } from "react";
import useToolsStore from "@/stores/useToolsStore";
import { Input } from "./ui/input";
import { CircleX } from "lucide-react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "./ui/tooltip";
import { TooltipProvider } from "./ui/tooltip";
import { useFiles } from "@/components/context/files-context";
import { dbService } from "@/lib/indexeddb-service";

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function FileSearchSetup() {
  const { vectorStore, setVectorStore } = useToolsStore();
  const { setVectorStore: setFilesVectorStore } = useFiles();
  const [newStoreId, setNewStoreId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [lastSyncedId, setLastSyncedId] = useState<string | null>(null);

  // Log vector store state on mount and when it changes
  useEffect(() => {
    console.log("[FileSearchSetup] Current vector store state:", vectorStore);
    // Ensure files context is synchronized with tools store, but only if the ID has changed
    if (vectorStore?.id && vectorStore.id !== lastSyncedId) {
      console.log("[FileSearchSetup] Synchronizing vector store with files context:", vectorStore.id);
      setLastSyncedId(vectorStore.id);
      setFilesVectorStore(vectorStore.id);
    } else if (!vectorStore?.id && lastSyncedId !== null) {
      console.log("[FileSearchSetup] Clearing vector store sync state");
      setLastSyncedId(null);
      setFilesVectorStore(null);
    }
  }, [vectorStore, setFilesVectorStore, lastSyncedId]);

  const unlinkStore = async () => {
    console.log("[FileSearchSetup] Unlinking vector store");
    setVectorStore({
      id: "",
      name: "",
    });
    console.log("[FileSearchSetup] Clearing vector store in files context");
    await setFilesVectorStore(null);
    setLastSyncedId(null);
  };

  const handleAddStore = async (storeId: string) => {
    if (storeId.trim()) {
      console.log("[FileSearchSetup] Adding vector store:", storeId);
      const newStore = await fetch(
        `/api/vector_stores/retrieve_store?vector_store_id=${storeId}`
      ).then((res) => res.json());
      console.log("[FileSearchSetup] Retrieved store response:", newStore);
      
      if (newStore.id) {
        console.log("[FileSearchSetup] Setting vector store in tools store:", newStore);
        setVectorStore(newStore);
        console.log("[FileSearchSetup] Setting vector store in files context:", newStore.id);
        await setFilesVectorStore(newStore.id);
        console.log("[FileSearchSetup] Vector store setup complete");
      } else {
        console.log("[FileSearchSetup] Vector store not found");
        alert("Vector store not found");
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // First, save the file locally
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = arrayBufferToBase64(arrayBuffer);
      
      const localFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: "file" as const,
        content: base64Content,
        mimeType: file.type || getMimeTypeFromExtension(file.name),
      };

      // Save to IndexedDB first
      await dbService.saveFile(localFile);
      console.log("[FileSearchSetup] Saved file locally:", localFile.name);

      // If we have a vector store, upload there too
      if (vectorStore?.id) {
        try {
          // Upload to OpenAI
          const uploadResponse = await fetch("/api/files/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileObject: {
                name: file.name,
                content: base64Content
              }
            })
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload to OpenAI');
          }

          const { id: openAiFileId } = await uploadResponse.json();

          // Associate with vector store
          const associateResponse = await fetch("/api/vector_stores/associate_file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileId: openAiFileId,
              vectorStoreId: vectorStore.id
            })
          });

          if (!associateResponse.ok) {
            throw new Error('Failed to associate with vector store');
          }

          // Update local file with vector store info
          const updatedFile = {
            ...localFile,
            vectorStoreId: vectorStore.id,
            vectorStoreFileId: openAiFileId
          };
          await dbService.updateFile(updatedFile);

          console.log("[FileSearchSetup] File uploaded and associated with vector store");
        } catch (error) {
          console.error("[FileSearchSetup] Vector store upload failed:", error);
          alert("File saved locally but vector store upload failed. You can try again later.");
        }
      }

      // Refresh the files list
      await setFilesVectorStore(vectorStore?.id || null);
    } catch (error) {
      console.error("[FileSearchSetup] Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to determine MIME type from file extension
  const getMimeTypeFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'md': return 'text/markdown';
      case 'json': return 'application/json';
      default: return 'text/plain';
    }
  };

  return (
    <div>
      <div className="text-sm text-zinc-500">
        Enter a vector store ID to use an existing one.
      </div>
      <div className="flex items-center gap-2 mt-2 h-10">
        <div className="flex items-center gap-2 w-full">
          <div className="text-sm font-medium w-24 text-nowrap">
            Vector store
          </div>
          {vectorStore?.id ? (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-zinc-400 text-xs font-mono flex-1 text-ellipsis truncate">
                  {vectorStore.id}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleX
                        onClick={() => unlinkStore()}
                        size={16}
                        className="cursor-pointer text-zinc-400 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 transition-all"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="mr-2">
                      <p>Unlink vector store</p>
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
                className="border border-zinc-300 rounded text-sm bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStore(newStoreId);
                  }
                }}
              />
              <div
                className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
                onClick={() => handleAddStore(newStoreId)}
              >
                Add
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
