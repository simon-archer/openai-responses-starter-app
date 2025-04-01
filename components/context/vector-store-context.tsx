"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from "react";
import VectorStoreService from "@/services/vector-store-service";
import FileService, { ExtendedFileItem, buildFileTree, getMimeTypeFromExtension } from "@/services/file-service";
import { toast } from "react-hot-toast";

// Re-define FileItem here or import from a shared types file if created
export interface FileItem extends ExtendedFileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  mimeType?: string;
  content?: string;
  parentId: string | null;
  children?: FileItem[];
  vectorStoreId?: string;
  vectorStoreFileId?: string;
  isVectorStoreFile?: boolean;
  lastModified?: string;
  isPlaceholder?: boolean;
}

// Define the shape of the Vector Store context data
export interface VectorStoreContextType {
  currentVectorStore: any | null; // Store the whole vector store object if needed
  currentVectorStoreId: string | null;
  files: FileItem[]; // The combined list of local files and placeholders
  isLoading: boolean;
  setVectorStore: (storeId: string | null) => Promise<void>;
  syncFiles: () => Promise<void>; // Exposed function to trigger manual sync if needed
  // Potentially add functions to link/unlink/delete that orchestrate both local and remote? 
}

// Key for localStorage
const LOCAL_STORAGE_KEY = 'vectorStoreId';

// Create the context
const VectorStoreContext = createContext<VectorStoreContextType | undefined>(undefined);

// Create the provider component
export const VectorStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentVectorStore, setCurrentVectorStoreState] = useState<any | null>(null);
  const [currentVectorStoreId, setCurrentVectorStoreId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]); // Holds the combined file list
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true for initial load check

  // Core synchronization function
  const syncFilesWithStore = useCallback(async (storeId: string | null) => {
    if (!storeId) {
      console.log("[VectorStoreContext] No store ID, clearing vector info from local files.");
      setIsLoading(true);
      try {
        await FileService.clearVectorStoreLinks(); // Remove links from IndexedDB files
        const localFiles = await FileService.loadFileTree(); // Load only local files
        setFiles(localFiles); // Update state with only local files
        setCurrentVectorStoreState(null);
        setCurrentVectorStoreId(null);
        // Remove from localStorage on clear
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.error("[VectorStoreContext] Error clearing vector store links:", error);
        toast.error("Error unlinking local files.");
        const localFiles = await FileService.loadFileTree(); // Still load local files on error
        setFiles(localFiles);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    console.log("[VectorStoreContext] Syncing files with store:", storeId);
    setIsLoading(true);
    try {
      // 1. Fetch vector store files
      const vectorFiles = await VectorStoreService.listFiles(storeId);
      
      // 2. Fetch local files from IndexedDB
      const localDbFiles = await FileService.getAllFiles();
      const localFileMap = new Map(localDbFiles.map(f => [f.id, f]));

      // 3. Perform Comparison and Linking/Placeholder Generation (Simplified Logic)
      const vectorFileMap = new Map(vectorFiles.map(vf => [vf.id, vf]));
      const updatedCombinedFiles: FileItem[] = [];
      const localFileUpdatePromises: Promise<void>[] = [];
      const processedLocalIds = new Set<string>();

      // Process local files: check link status
      for (const localFile of localDbFiles) {
        processedLocalIds.add(localFile.id);
        let fileToPush = { ...localFile };
        let needsDbUpdate = false;

        if (localFile.vectorStoreFileId) {
          if (!vectorFileMap.has(localFile.vectorStoreFileId) || vectorFileMap.get(localFile.vectorStoreFileId)?.status === 'deleted') {
            // Unlink if vector file is gone or deleted
            console.log(`[VectorStoreContext] Unlinking local file ${localFile.name} (VS file ${localFile.vectorStoreFileId} not found/deleted).`);
            fileToPush = { ...localFile, vectorStoreId: undefined, vectorStoreFileId: undefined, isVectorStoreFile: undefined };
            needsDbUpdate = true;
          } else if (localFile.vectorStoreId !== storeId) {
             // Update store ID if it changed
             console.log(`[VectorStoreContext] Updating vector store ID for local file ${localFile.name}.`);
             fileToPush = { ...localFile, vectorStoreId: storeId };
             needsDbUpdate = true;
          }
        } else {
          // Try to link by name if not already linked
          const matchingVectorFile = vectorFiles.find(vf => vf.name === localFile.name && vf.status !== 'deleted');
          if (matchingVectorFile) {
            console.log(`[VectorStoreContext] Linking local file ${localFile.name} to VS file ${matchingVectorFile.id} by name.`);
            fileToPush = { ...localFile, vectorStoreId: storeId, vectorStoreFileId: matchingVectorFile.id, isVectorStoreFile: true };
            needsDbUpdate = true;
          }
        }

        if (needsDbUpdate) {
          // Push the update promise using the final state of the file for this iteration
          localFileUpdatePromises.push(FileService.updateFile(fileToPush));
        }
        updatedCombinedFiles.push(fileToPush); // Add the potentially updated local file to the combined list
      }
      
      // Wait for all local file DB updates to finish
      await Promise.all(localFileUpdatePromises);
      console.log("[VectorStoreContext] Local file DB updates complete.");

      // Process vector files: create placeholders for non-linked ones
      for (const vectorFile of vectorFiles) {
         if (vectorFile.status === 'deleted') continue; // Skip deleted vector files
         
         // Check if any file in our combined list is linked to this vector file
         const isLinked = updatedCombinedFiles.some(cf => cf.vectorStoreFileId === vectorFile.id && !cf.isPlaceholder);

         if (!isLinked) {
            console.log(`[VectorStoreContext] Creating placeholder for VS file: ${vectorFile.name} (${vectorFile.id})`);
            const filename = vectorFile.name || vectorFile.metadata?.filename || `vs-file-${vectorFile.id}`;
            const placeholder: FileItem = {
              id: `placeholder-${vectorFile.id}`,
              name: filename,
              path: filename, // Basic path for placeholder
              type: "file",
              mimeType: getMimeTypeFromExtension(filename),
              content: undefined,
              parentId: null,
              vectorStoreId: storeId,
              vectorStoreFileId: vectorFile.id,
              isVectorStoreFile: true,
              isPlaceholder: true,
              lastModified: vectorFile.created_at ? new Date(vectorFile.created_at * 1000).toISOString() : new Date().toISOString()
            };
            updatedCombinedFiles.push(placeholder);
         }
      }

      // 4. Build the final tree structure and update state
      const finalFileTree = buildFileTree(updatedCombinedFiles);
      setFiles(finalFileTree);
      console.log("[VectorStoreContext] Sync complete. Final file tree:", finalFileTree);

    } catch (error) {
      console.error("[VectorStoreContext] Error during file sync:", error);
      toast.error("Failed to sync files with vector store.");
      // Fallback: Load only local files
      const localFiles = await FileService.loadFileTree();
      setFiles(localFiles);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to set/change the vector store
  const setVectorStore = useCallback(async (storeId: string | null) => {
    if (storeId === currentVectorStoreId) {
        console.log("[VectorStoreContext] Store ID hasn't changed.");
        // Optionally trigger sync anyway if needed?
        // await syncFilesWithStore(storeId);
        return;
    }

    setIsLoading(true);
    if (storeId) {
      try {
        console.log("[VectorStoreContext] Retrieving vector store:", storeId);
        const store = await VectorStoreService.getStore(storeId);
        if (store && store.id) {
          setCurrentVectorStoreState(store);
          setCurrentVectorStoreId(store.id);
          localStorage.setItem(LOCAL_STORAGE_KEY, store.id); // Save to localStorage
          await syncFilesWithStore(store.id); // Sync files after setting store
          toast.success("Connected to vector store!"); // Success toast
        } else {
          console.warn("[VectorStoreContext] Vector store not found:", storeId);
          toast.error("Vector store not found.");
          // Clear state if store not found
          setCurrentVectorStoreState(null);
          setCurrentVectorStoreId(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove if not found
          await syncFilesWithStore(null);
        }
      } catch (error) {
        console.error("[VectorStoreContext] Error setting vector store:", error);
        toast.error("Failed to connect to vector store.");
        setCurrentVectorStoreState(null);
        setCurrentVectorStoreId(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove on error
        await syncFilesWithStore(null); // Clear files on error
      } finally {
        // setIsLoading(false); // Loading state handled within sync
      }
    } else {
      // Clear the store
      console.log("[VectorStoreContext] Clearing vector store.");
      setCurrentVectorStoreState(null);
      setCurrentVectorStoreId(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove from localStorage
      await syncFilesWithStore(null); // Sync (which will clear links)
      setIsLoading(false); // Set loading false after clearing
    }
  }, [currentVectorStoreId, syncFilesWithStore]);

  // Effect to load stored ID on initial mount
  useEffect(() => {
    const savedStoreId = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log("[VectorStoreContext] Initial load, checking localStorage for ID:", savedStoreId);
    if (savedStoreId) {
      setVectorStore(savedStoreId); // Attempt to connect to the saved store
    } else {
       // No saved ID, just load local files initially
       setIsLoading(true);
       FileService.loadFileTree().then(localFiles => {
           setFiles(localFiles);
           setIsLoading(false);
       }).catch(() => setIsLoading(false));
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies needed here for initial load

  // Exposed sync function (useful for manual refresh button)
  const syncFiles = useCallback(async () => {
      if (!currentVectorStoreId) {
         toast.error("No vector store connected.");
         return;
      }
      toast.loading("Syncing files...", { id: 'sync-toast' });
      await syncFilesWithStore(currentVectorStoreId);
      toast.success("Files synced!", { id: 'sync-toast' });
  }, [currentVectorStoreId, syncFilesWithStore]);

  // Context value
  const contextValue: VectorStoreContextType = {
    currentVectorStore,
    currentVectorStoreId,
    files,
    isLoading,
    setVectorStore,
    syncFiles,
  };

  return (
    <VectorStoreContext.Provider value={contextValue}>
      {children}
    </VectorStoreContext.Provider>
  );
};

// Custom hook to use the vector store context
export const useVectorStore = (): VectorStoreContextType => {
  const context = useContext(VectorStoreContext);
  if (context === undefined) {
    throw new Error('useVectorStore must be used within a VectorStoreProvider');
  }
  return context;
};

export default VectorStoreProvider; 