"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from "react";
import { dbService } from "@/lib/indexeddb-service";

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

// Sample data structure for files
export type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
  mimeType?: string; // To help determine how to display the file
  content?: string; // Sample content for demo purposes
  parentId?: string | null; // To track parent folder for flat storage
  isVectorStoreFile?: boolean; // Optional vector store file marker
  vectorStoreId?: string; // ID of the vector store this file belongs to
  localFileId?: string; // ID of the corresponding local file if this is a vector store file
  vectorStoreFileId?: string; // ID of the corresponding vector store file if this is a local file
};

export type TabItem = {
  id: string;
  fileId: string;
  fileName: string;
  mimeType?: string;
};

export type FilesContextType = {
  files: FileItem[];
  expandedFolders: { [key: string]: boolean };
  isLoading: boolean;
  selectedFileId: string | null;
  selectedFile: FileItem | null;
  openTabs: TabItem[];
  activeTabId: string | null;
  toggleFolder: (folderId: string) => void;
  selectFile: (fileId: string) => void;
  findFileById: (fileId: string, items: FileItem[]) => FileItem | null;
  openFileInTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  deleteFile: (fileId: string) => Promise<void>;
  setFiles: (files: FileItem[]) => void;
  uploadFile: (file: File) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  refreshFile: (file: FileItem) => void;
  setVectorStore: (vectorStoreId: string | null) => Promise<void>;
  currentVectorStoreId: string | null;
  linkFileToVectorStore: (fileId: string) => Promise<void>;
  unlinkFileFromVectorStore: (fileId: string) => Promise<void>;
};

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error("useFiles must be used within a FilesProvider");
  }
  return context;
};

// Helper function to convert flat files list to a hierarchical structure
const buildFileTree = (files: FileItem[]): FileItem[] => {
  const fileMap: { [key: string]: FileItem } = {};
  const rootItems: FileItem[] = [];

  // First pass: Create a mapping of id to file item
  files.forEach(file => {
    fileMap[file.id] = { ...file, children: file.type === 'folder' ? [] : undefined };
  });

  // Second pass: Build the hierarchy
  files.forEach(file => {
    if (file.parentId === null || file.parentId === undefined) {
      // This is a root item
      rootItems.push(fileMap[file.id]);
    } else if (fileMap[file.parentId]) {
      // This has a parent, add it to the parent's children
      if (!fileMap[file.parentId].children) {
        fileMap[file.parentId].children = [];
      }
      fileMap[file.parentId].children!.push(fileMap[file.id]);
    } else {
      // Parent not found, treat as root
      rootItems.push(fileMap[file.id]);
    }
  });

  return rootItems;
};

export const FilesProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Add state for vector store integration
  const [vectorStoreFiles, setVectorStoreFiles] = useState<FileItem[]>([]);
  const [currentVectorStoreId, setCurrentVectorStoreId] = useState<string | null>(null);

  // Function to fetch vector store files
  const fetchVectorStoreFiles = useCallback(async (vectorStoreId: string) => {
    try {
      console.log("[FilesContext] Fetching vector store files for:", vectorStoreId);
      const response = await fetch(`/api/vector_stores/list_files?vector_store_id=${vectorStoreId}`);
      console.log("[FilesContext] Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[FilesContext] Failed to fetch vector store files:", errorData);
        throw new Error('Failed to fetch vector store files');
      }
      
      const data = await response.json();
      console.log("[FilesContext] Vector store files received:", data);
      
      // Get all local files to check for relationships
      const localFiles = await dbService.getAllFiles();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Update local files with vector store info if needed
        for (const vectorFile of data) {
          const matchingLocalFile = localFiles.find(
            localFile => localFile.name === vectorFile.name
          );

          if (matchingLocalFile) {
            // Update existing local file with vector store info
            const updatedFile = {
              ...matchingLocalFile,
              vectorStoreId,
              vectorStoreFileId: vectorFile.id,
              isVectorStoreFile: true
            };
            await dbService.updateFile(updatedFile);
          }
        }
      }
      
      // Reload all files to get the updated state
      const updatedFiles = await dbService.getAllFiles();
      const fileTree = buildFileTree(updatedFiles);
      setFiles(fileTree);
      
      setCurrentVectorStoreId(vectorStoreId);
    } catch (error) {
      console.error('[FilesContext] Error fetching vector store files:', error);
      setFiles([]);
    }
  }, []);

  // Add helper function to link local file to vector store file
  const linkLocalFileToVectorStore = async (localFileId: string, vectorStoreFileId: string, vectorStoreId: string) => {
    const localFile = await dbService.getFile(localFileId);
    if (!localFile) return;

    const updatedFile = {
      ...localFile,
      vectorStoreFileId,
      vectorStoreId
    };
    await dbService.saveFile(updatedFile);
    await loadFiles(); // Refresh the file list
  };

  // Update loadFiles to not add vector store files separately
  const loadFiles = useCallback(async () => {
    try {
      const dbFiles = await dbService.getAllFiles();
      if (dbFiles && dbFiles.length > 0) {
        const fileTree = buildFileTree(dbFiles);
        setFiles(fileTree);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]);
    }
  }, []);

  // Initialize files and vector store files
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await dbService.initDB();
        await loadFiles();
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [loadFiles]);

  // Add function to set current vector store
  const setVectorStore = async (vectorStoreId: string | null) => {
    console.log("[FilesContext] Setting vector store:", vectorStoreId);
    // Only fetch files if the vector store ID has actually changed
    if (vectorStoreId !== currentVectorStoreId) {
      if (vectorStoreId) {
        console.log("[FilesContext] Fetching vector store files...");
        await fetchVectorStoreFiles(vectorStoreId);
        console.log("[FilesContext] Vector store files fetched and currentVectorStoreId set to:", vectorStoreId);
      } else {
        console.log("[FilesContext] Clearing vector store files");
        setVectorStoreFiles([]);
        setCurrentVectorStoreId(null);
      }
      await loadFiles();
    } else {
      console.log("[FilesContext] Vector store ID unchanged, skipping fetch");
    }
  };

  // Add effect to log vector store state changes
  useEffect(() => {
    console.log("[FilesContext] Current vector store ID changed to:", currentVectorStoreId);
  }, [currentVectorStoreId]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const findFileById = (fileId: string, fileList: FileItem[]): FileItem | null => {
    for (const file of fileList) {
      if (file.id === fileId) {
        return file;
      }
      if (file.type === 'folder' && file.children) {
        const found = findFileById(fileId, file.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    const file = findFileById(fileId, files);
    setSelectedFile(file);
  };

  const openFileInTab = (fileId: string) => {
    const file = findFileById(fileId, files);
    if (!file || file.type !== 'file') return;

    // Check if tab already exists
    const existingTabIndex = openTabs.findIndex(tab => tab.fileId === fileId);
    
    if (existingTabIndex !== -1) {
      // Tab already exists, make it active
      setActiveTabId(openTabs[existingTabIndex].id);
    } else {
      // Create new tab
      const newTab: TabItem = {
        id: generateUniqueId(),
        fileId,
        fileName: file.name,
        mimeType: file.mimeType
      };
      
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }

    // Also update selected file for consistency
    setSelectedFileId(fileId);
    setSelectedFile(file);
  };

  const closeTab = (tabId: string) => {
    const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = [...openTabs];
    newTabs.splice(tabIndex, 1);
    setOpenTabs(newTabs);

    // If we closed the active tab, select another tab
    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        // Prefer to select tab to the left, or the first tab if we closed the leftmost
        const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex].id);
        setSelectedFileId(newTabs[newActiveIndex].fileId);
        const file = findFileById(newTabs[newActiveIndex].fileId, files);
        setSelectedFile(file);
      } else {
        // No tabs left
        setActiveTabId(null);
        setSelectedFileId(null);
        setSelectedFile(null);
      }
    }
  };

  const setActiveTab = (tabId: string) => {
    const tab = openTabs.find(tab => tab.id === tabId);
    if (!tab) return;

    setActiveTabId(tabId);
    setSelectedFileId(tab.fileId);
    const file = findFileById(tab.fileId, files);
    setSelectedFile(file);
  };

  // Update uploadFile to handle vector store files
  const uploadFile = async (file: File): Promise<void> => {
    if (!isBrowser) return;
    
    try {
      setIsLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = arrayBufferToBase64(arrayBuffer);
      
      // Generate IDs for both local and vector store versions
      const localFileId = generateUniqueId();
      const vectorStoreFileId = generateUniqueId();

      // Create the local file entry
      const newLocalFile: FileItem = {
        id: localFileId,
        name: file.name,
        type: "file",
        mimeType: file.type || getMimeTypeFromExtension(file.name),
        content: base64Content,
        parentId: null,
        vectorStoreFileId: undefined // Will be set if vector store upload succeeds
      };

      // Save local file first
      await dbService.saveFile(newLocalFile);
      
      // If vector store is connected, upload there too
      if (currentVectorStoreId) {
        try {
          // Step 1: Upload file to OpenAI
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
            throw new Error('Failed to upload file to OpenAI');
          }

          const uploadData = await uploadResponse.json();
          const openAiFileId = uploadData.id;

          // Step 2: Associate with vector store
          const associateResponse = await fetch("/api/vector_stores/associate_file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileId: openAiFileId,
              vectorStoreId: currentVectorStoreId
            })
          });

          if (!associateResponse.ok) {
            throw new Error('Failed to associate file with vector store');
          }

          // Update local file with vector store reference
          const updatedLocalFile = {
            ...newLocalFile,
            vectorStoreFileId: vectorStoreFileId,
            vectorStoreId: currentVectorStoreId
          };
          await dbService.saveFile(updatedLocalFile);

          // Refresh vector store files
          await fetchVectorStoreFiles(currentVectorStoreId);
        } catch (vectorStoreError) {
          console.error("Error uploading to vector store:", vectorStoreError);
          // Don't fail the whole upload if vector store fails
        }
      }

      // Reload all files
      await loadFiles();
      
      // Open the file in a tab
      openFileInTab(localFileId);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine MIME type from file extension
  const getMimeTypeFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
        return 'application/javascript';
      case 'ts':
        return 'application/typescript';
      case 'jsx':
      case 'tsx':
        return 'application/typescript-react';
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'json':
        return 'application/json';
      case 'md':
        return 'text/markdown';
      case 'txt':
        return 'text/plain';
      case 'pdf':
        return 'application/pdf';
      default:
        // If filename ends with .pdf but wasn't caught by switch
        if (filename.toLowerCase().endsWith('.pdf')) {
          return 'application/pdf';
        }
        return 'text/plain';
    }
  };

  // Function to create a new folder
  const createFolder = async (name: string): Promise<void> => {
    if (!isBrowser) return;
    
    // Generate a unique ID for the folder
    const folderId = generateUniqueId();
    
    // Create a folder FileItem
    const newFolder: FileItem = {
      id: folderId,
      name: name,
      type: "folder",
      parentId: null,
      children: []
    };
    
    try {
      // Save the folder to IndexedDB
      await dbService.saveFile(newFolder);
      
      // Update the files state
      setFiles(prevFiles => {
        if (folderId) {
          // Add to root
          return [...prevFiles, newFolder];
        } else {
          // Add to root
          return [...prevFiles, newFolder];
        }
      });
      
      // Expand the new folder
      setExpandedFolders(prev => ({
        ...prev,
        [folderId]: true
      }));
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };

  // Generate a unique ID to ensure server-side rendering doesn't break
  const generateUniqueId = () => {
    if (typeof window !== 'undefined' && window.crypto) {
      return crypto.randomUUID();
    }
    // Fallback for server-side rendering
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Function to link a file to the vector store
  const linkFileToVectorStore = async (fileId: string) => {
    try {
      setIsLoading(true);
      const file = findFileById(fileId, files);
      if (!file || !currentVectorStoreId) return;

      // Upload to OpenAI
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileObject: {
            name: file.name,
            content: file.content
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload to vector store');
      }

      const { id: openAiFileId } = await response.json();

      // Associate with vector store
      const associateResponse = await fetch("/api/vector_stores/associate_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: openAiFileId,
          vectorStoreId: currentVectorStoreId
        })
      });

      if (!associateResponse.ok) {
        throw new Error('Failed to associate with vector store');
      }

      // Update local file
      const updatedFile = {
        ...file,
        vectorStoreFileId: openAiFileId,
        vectorStoreId: currentVectorStoreId
      };
      await dbService.updateFile(updatedFile);

      // Refresh files list
      await loadFiles();
    } catch (error) {
      console.error("Error linking file:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unlink a file from the vector store
  const unlinkFileFromVectorStore = async (fileId: string) => {
    try {
      setIsLoading(true);
      const file = findFileById(fileId, files);
      if (!file?.vectorStoreFileId) return;

      // Unlink from vector store
      const response = await fetch("/api/files/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.vectorStoreFileId })
      });

      if (!response.ok) {
        throw new Error('Failed to unlink from vector store');
      }

      // Update local file
      const updatedFile = {
        ...file,
        vectorStoreFileId: undefined,
        vectorStoreId: undefined
      };
      await dbService.updateFile(updatedFile);

      // Refresh files list
      await loadFiles();
    } catch (error) {
      console.error("Error unlinking file:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced delete function to handle both local and vector store files
  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const file = findFileById(fileId, files);
      if (!file) return;

      // If file is linked to vector store, delete it there first
      if (file.vectorStoreFileId) {
        try {
          await fetch("/api/files/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: file.vectorStoreFileId })
          });
        } catch (error) {
          console.error("Error deleting from vector store:", error);
          // Continue with local deletion even if vector store deletion fails
        }
      }

      // Delete locally
      await dbService.deleteFile(fileId);

      // Close tab if open
      const tabWithFile = openTabs.find(tab => tab.fileId === fileId);
      if (tabWithFile) {
        closeTab(tabWithFile.id);
      }

      // Clear selection if selected
      if (selectedFileId === fileId) {
        setSelectedFileId(null);
        setSelectedFile(null);
      }

      // Refresh files list
      await loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Method to refresh a file after it's been updated
  const refreshFile = (updatedFile: FileItem) => {
    console.log("Refreshing file in context:", updatedFile.name);
    
    // Update the file in the files state
    setFiles(prevFiles => {
      return updateFileTree(prevFiles, updatedFile.id, () => updatedFile);
    });
    
    // If this is the selected file, update it in state
    if (selectedFileId === updatedFile.id) {
      setSelectedFile(updatedFile);
    }
    
    // Update the file content in open tabs if needed
    const tabWithFile = openTabs.find(tab => tab.fileId === updatedFile.id);
    if (tabWithFile) {
      // Update tab metadata if needed
      setOpenTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.fileId === updatedFile.id 
            ? { ...tab, mimeType: updatedFile.mimeType } 
            : tab
        )
      );
    }
  };

  const value = {
    files,
    expandedFolders,
    isLoading,
    selectedFileId,
    selectedFile,
    openTabs,
    activeTabId,
    toggleFolder,
    selectFile,
    findFileById,
    openFileInTab,
    closeTab,
    setActiveTab,
    deleteFile,
    setFiles,
    uploadFile,
    createFolder,
    refreshFile,
    setVectorStore,
    currentVectorStoreId,
    linkFileToVectorStore,
    unlinkFileFromVectorStore
  };

  return (
    <FilesContext.Provider
      value={value}
    >
      {children}
    </FilesContext.Provider>
  );
}; 