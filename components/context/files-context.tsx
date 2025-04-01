"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from "react";
import { dbService } from "@/lib/indexeddb-service";
import FileService, { 
  findFileById as findFileInListUtil, 
  buildFileTree as buildFileTreeUtil, 
  arrayBufferToBase64 as arrayBufferToBase64Util, 
  getMimeTypeFromExtension as getMimeTypeFromExtensionUtil, 
  ExtendedFileItem // Keep this for potential use in VectorStoreService/Context
} from "@/services/file-service";
import { useVectorStore } from "./vector-store-context"; // Import useVectorStore
import { toast } from "react-hot-toast";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Define the structure of a file item (combining FileItem and relevant ExtendedFileItem props)
export interface FileItem {
  id: string;
  name: string;
  path: string; // Ensure path is always present
  type: "file" | "folder";
  mimeType?: string;
  content?: string; // Base64 encoded content for files
  parentId: string | null;
  children?: FileItem[];
  vectorStoreId?: string;
  vectorStoreFileId?: string;
  isVectorStoreFile?: boolean; // Optional: Indicate if it's primarily a vector store file
  lastModified?: string; // Optional last modified date
  isPlaceholder?: boolean; // Optional placeholder flag
}

// Define the structure of a tab item
export type TabItem = {
  id: string;
  fileId: string;
  title: string; // Use title for consistency
  mimeType?: string; // Optional mimeType for editor handling
};

// Define the shape of the context data
export interface FilesContextType {
  files: FileItem[]; // This will now reflect the state from VectorStoreContext
  expandedFolders: { [key: string]: boolean };
  isLoading: boolean;
  selectedFileId: string | null;
  openTabs: TabItem[];
  activeTabId: string | null;
  currentVectorStoreId: string | null; // Track vector store ID (synced from VectorStoreContext)
  setFiles: (files: FileItem[]) => void; // Function to directly set files (used internally or by VSContext)
  toggleFolder: (folderId: string) => void;
  selectFile: (fileId: string) => void;
  openFileInTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  addFile: (file: FileItem) => void; // Add local file
  uploadFile: (file: File) => Promise<FileItem | undefined>; // Upload and save local file
  deleteFile: (fileId: string) => Promise<void>; // Delete local file
  loadFiles: () => Promise<void>; // Load local files initially
  findFileById: (fileId: string, fileList?: FileItem[]) => FileItem | null;
  createFolder: (name: string, parentId?: string | null) => Promise<void>; // Create local folder
}

// Create the context
const FilesContext = createContext<FilesContextType | undefined>(undefined);

// Create the provider component
export const FilesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFilesState] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentVectorStoreIdLocal, setCurrentVectorStoreIdLocal] = useState<string | null>(null);
  
  // Get state and sync function from VectorStoreContext
  const {
    files: vectorStoreFiles,
    currentVectorStoreId: vectorStoreIdFromContext,
    syncFiles: syncVectorStoreFiles, // Get the sync function
    isLoading: isVectorStoreLoading // Get loading state from vector store context
  } = useVectorStore();

  // Update main file list when VectorStoreContext changes
  useEffect(() => {
    console.log("[FilesContext] Received updated files from VectorStoreContext:", vectorStoreFiles);
    if (vectorStoreFiles) {
      const filesWithPaths = vectorStoreFiles.map((f: FileItem) => ({ ...f, path: f.path || f.name }));
      setFilesState(filesWithPaths);
      // Don't set isLoading false here, rely on isVectorStoreLoading
    }
  }, [vectorStoreFiles]);
  
  // Update local tracking of vector store ID
  useEffect(() => {
     if (vectorStoreIdFromContext !== undefined) {
       setCurrentVectorStoreIdLocal(vectorStoreIdFromContext);
     }
  }, [vectorStoreIdFromContext]);

  // Pass through the loading state from VectorStoreContext
  const effectiveIsLoading = isLoading || isVectorStoreLoading;

  // Function to set files (used internally or potentially by VSContext)
  const setFiles = (newFiles: FileItem[]) => {
     console.log("[FilesContext] setFiles called (likely internal update):", newFiles);
     const filesWithPaths = newFiles.map((f: FileItem) => ({ ...f, path: f.path || f.name }));
     setFilesState(filesWithPaths);
  };

  // Toggle folder expansion state
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Select a file
  const selectFile = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  // Find file by ID helper (searches the current state)
  const findFileById = (fileId: string, fileList: FileItem[] = files): FileItem | null => {
     return findFileInListUtil(fileId, fileList);
  };

  // Open a file in a new tab or switch to it if already open
  const openFileInTab = (fileId: string) => {
    const file = findFileById(fileId);
    if (!file || file.type === 'folder') return; // Only open files

    const existingTab = openTabs.find(tab => tab.fileId === fileId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      localStorage.setItem('activeTabId', existingTab.id);
    } else {
      const newTab: TabItem = {
        id: `tab-${fileId}`,
        fileId: fileId,
        title: file.name,
        mimeType: file.mimeType
      };
      const updatedTabs = [...openTabs, newTab];
      setOpenTabs(updatedTabs);
      setActiveTabId(newTab.id);
      localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
      localStorage.setItem('activeTabId', newTab.id);
    }
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    const updatedTabs = openTabs.filter(tab => tab.id !== tabId);
    let newActiveTabId = activeTabId;

    if (activeTabId === tabId) {
      newActiveTabId = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].id : null;
    }
    
    setOpenTabs(updatedTabs);
    setActiveTabId(newActiveTabId);
    localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
    localStorage.setItem('activeTabId', newActiveTabId || '');
    
    // If the closed tab was the active one, and no other tabs are open, clear selection
    if (activeTabId === tabId && !newActiveTabId) {
        setSelectedFileId(null);
    }
  };

  // Set the active tab
  const setActiveTab = (tabId: string) => {
    setActiveTabId(tabId);
    localStorage.setItem('activeTabId', tabId);
  };

  // Function to add a new file (local only)
  const addFile = (file: FileItem) => {
    // Ensure path exists
    const fileWithPath = { ...file, path: file.path || file.name };
    FileService.saveFile(fileWithPath).then(() => {
       // Directly update state after saving to DB
       // Note: This state update might be overwritten when VectorStoreContext syncs
       setFilesState(prevFiles => [...prevFiles, fileWithPath]);
       toast.success(`${file.name} added locally.`);
    }).catch(error => {
      console.error("Failed to save new file:", error);
      toast.error("Failed to add file locally.");
    });
  };

  // Function to upload a file (saves locally, then triggers sync)
  const uploadFile = async (file: File): Promise<FileItem | undefined> => {
    // Use the effective loading state to prevent uploads during sync
    if (effectiveIsLoading) {
        toast.error("Please wait for current operations to complete.");
        return undefined;
    }
    
    setIsLoading(true); // Set local loading true for the upload itself
    let newFile: FileItem | undefined;
    try {
      console.log(`[FilesContext] Starting upload for: ${file.name}`);
      newFile = await FileService.createFileFromUpload(file);
      console.log(`[FilesContext] FileService created local file:`, newFile);
      toast.success(`${file.name} saved locally. Syncing...`);
      
      // --- Trigger sync from VectorStoreContext --- 
      // This will re-fetch the combined file list including the new one
      // and update the state via the useEffect hook above.
      await syncVectorStoreFiles(); 
      // -------------------------------------------

      console.log(`[FilesContext] Sync triggered after upload for: ${file.name}`);
      return newFile; // Return the file data created by FileService

    } catch (error) {
      console.error("[FilesContext] Error uploading file:", error);
      toast.error(`Failed to upload ${file.name}.`);
      return undefined;
    } finally {
      setIsLoading(false); // Set local loading false
    }
  };

  // Function to delete a file (handles local deletion only)
  const deleteFile = async (fileId: string) => {
    const file = findFileById(fileId);
    if (!file) return;

    // Vector store deletion should be triggered separately (e.g., in FilesPanel)
    console.log("[FilesContext] Deleting local file:", file.id, file.name);
    
    try {
      await FileService.deleteFile(fileId);
      console.log("[FilesContext] Successfully deleted local file from DB");
      
      // Update state: Remove the file from the list
      const removeFileRecursively = (items: FileItem[], idToRemove: string): FileItem[] => {
          return items.filter(item => item.id !== idToRemove).map(item => {
              if (item.children) {
                  return { ...item, children: removeFileRecursively(item.children, idToRemove) };
              }
              return item;
          });
      };
      setFilesState(prevFiles => removeFileRecursively(prevFiles, fileId));

      // Close any open tabs with this file
      const tabWithFile = openTabs.find(tab => tab.fileId === fileId);
      if (tabWithFile) {
        closeTab(tabWithFile.id);
      }

      // Clear selection if this file was selected
      if (selectedFileId === fileId) {
        selectFile(""); // Use the selectFile function to clear selection
      }
      toast.success(`File ${file.name} deleted locally.`);
      
    } catch (error) {
      console.error("[FilesContext] Error deleting local file:", error);
      toast.error(`Failed to delete ${file.name} locally.`);
      throw error; // Re-throw for handling in UI if needed
    }
  };

  // Function to load files from LOCAL storage initially
  const loadFiles = async () => {
    setIsLoading(true);
    console.log("[FilesContext] Initial load from IndexedDB...");
    try {
      const loadedFiles = await FileService.loadFileTree();
      console.log("[FilesContext] Loaded files from local storage:", loadedFiles);
      // Ensure path exists for all loaded files
      const filesWithPath = loadedFiles.map((f: FileItem) => ({ ...f, path: f.path || f.name }));
      setFilesState(filesWithPath); // Set local state initially
      
      // Load open tabs from local storage
      const savedTabs = localStorage.getItem('openTabs');
      if (savedTabs) {
        setOpenTabs(JSON.parse(savedTabs));
      }
      const savedActiveTab = localStorage.getItem('activeTabId');
      if (savedActiveTab) {
        setActiveTabId(savedActiveTab);
      }

    } catch (error) {
      console.error("Error loading local files:", error);
    } finally {
       // Don't set isLoading false here; wait for VectorStoreContext update via useEffect
    }
  };
  
  // Initial load logic (might need adjustment if VSContext handles initial load)
  useEffect(() => {
    // If VectorStoreContext handles the initial load including local files,
    // this might become redundant or only handle the case where no VS ID is stored.
    console.log("[FilesContext] Initial load effect running.");
    // Let VectorStoreContext handle the initial loading spinner and file fetching.

    // Load tabs from localStorage
    if (isBrowser) {
        const savedTabs = localStorage.getItem('openTabs');
        const savedActiveTab = localStorage.getItem('activeTabId');
        if (savedTabs) {
            try {
                setOpenTabs(JSON.parse(savedTabs));
            } catch (e) {
                console.error("Failed to parse saved tabs:", e);
                localStorage.removeItem('openTabs');
            }
        }
        if (savedActiveTab) {
            setActiveTabId(savedActiveTab);
        }
    }

    // Files are loaded via useEffect listening to vectorStoreFiles

  }, []); // Runs once on mount

  // Function to create a new folder (local only)
  const createFolder = async (name: string, parentId: string | null = null) => {
    setIsLoading(true);
    try {
      const newFolder = await FileService.createFolder(name, parentId);
      // Ensure path exists - FileService should handle this now
      const folderWithPath = { ...newFolder, path: newFolder.path || newFolder.name }; 
      
      // Add the new folder to the state (handle nested structure)
      setFilesState(prevFiles => {
        const addFolderRecursively = (items: FileItem[]): FileItem[] => {
            if (parentId === null) {
                // Add to root and sort folders first, then files
                const newItems = [...items, folderWithPath];
                return newItems.sort((a, b) => {
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });
            }
            return items.map(item => {
                if (item.id === parentId && item.type === 'folder') {
                     const updatedChildren = [...(item.children || []), folderWithPath].sort((a, b) => {
                        if (a.type === 'folder' && b.type !== 'folder') return -1;
                        if (a.type !== 'folder' && b.type === 'folder') return 1;
                        return a.name.localeCompare(b.name);
                     });
                    return { ...item, children: updatedChildren };
                }
                if (item.children) {
                    return { ...item, children: addFolderRecursively(item.children) };
                }
                return item;
            });
        };
        return addFolderRecursively(prevFiles);
      });
      toast.success(`Folder '${name}' created locally.`);
    } catch (error) {
      console.error("Failed to create folder locally:", error);
      toast.error("Failed to create folder locally");
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: FilesContextType = {
    files,
    expandedFolders,
    isLoading: effectiveIsLoading, // Use the combined loading state
    selectedFileId,
    openTabs,
    activeTabId,
    currentVectorStoreId: currentVectorStoreIdLocal,
    setFiles,
    toggleFolder,
    selectFile,
    openFileInTab,
    closeTab,
    setActiveTab,
    addFile,
    uploadFile,
    deleteFile,
    loadFiles: async () => {
        // Make loadFiles also trigger the vector store sync for consistency
        console.log("[FilesContext] loadFiles called, triggering VectorStore sync.");
        await syncVectorStoreFiles();
    },
    findFileById,
    createFolder,
  };

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  );
};

// Custom hook to use the files context
export const useFiles = (): FilesContextType => {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
}; 