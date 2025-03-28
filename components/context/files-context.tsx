"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from "react";
import { dbService } from "@/lib/indexeddb-service";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Sample data structure for files
export type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
  mimeType?: string; // To help determine how to display the file
  content?: string; // Sample content for demo purposes
  parentId?: string | null; // To track parent folder for flat storage
};

export type TabItem = {
  id: string;
  fileId: string;
  fileName: string;
  mimeType?: string;
};

interface FilesContextType {
  files: FileItem[];
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;
  selectedFileId: string | null;
  selectedFile: FileItem | null;
  openTabs: TabItem[];
  activeTabId: string | null;
  toggleFolder: (folderId: string) => void;
  selectFile: (fileId: string) => void;
  openFileInTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  uploadFile: (file: File) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  refreshFile: (file: FileItem) => void;
  findFileById: (fileId: string, fileList: FileItem[]) => FileItem | null;
}

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

  const loadExampleFiles = useCallback(async () => {
    // Sample files for demonstration
    const sampleFiles: FileItem[] = [
      {
        id: "1",
        name: "Project Files",
        type: "folder",
        parentId: null,
      },
      { 
        id: "1-1", 
        name: "index.js", 
        type: "file", 
        mimeType: "application/javascript",
        content: "// JavaScript code\nconst app = {};\nconsole.log('Hello world');\n\nfunction example() {\n  return 'This is a code sample';\n}",
        parentId: "1",
      },
      { 
        id: "1-2", 
        name: "styles.css", 
        type: "file",
        mimeType: "text/css",
        content: "/* CSS styles */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  color: #333;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}",
        parentId: "1",
      },
      { 
        id: "1-3", 
        name: "components", 
        type: "folder",
        parentId: "1",
      },
      { 
        id: "1-3-1", 
        name: "Header.jsx", 
        type: "file",
        mimeType: "text/jsx",
        content: "import React from 'react';\n\nexport default function Header() {\n  return (\n    <header className=\"header\">\n      <h1>Project Title</h1>\n      <nav>\n        <ul>\n          <li><a href=\"#\">Home</a></li>\n          <li><a href=\"#\">About</a></li>\n          <li><a href=\"#\">Contact</a></li>\n        </ul>\n      </nav>\n    </header>\n  );\n}",
        parentId: "1-3",
      },
      { 
        id: "1-3-2", 
        name: "Footer.jsx", 
        type: "file",
        mimeType: "text/jsx",
        content: "import React from 'react';\n\nexport default function Footer() {\n  return (\n    <footer className=\"footer\">\n      <p>&copy; {new Date().getFullYear()} Project Name</p>\n    </footer>\n  );\n}",
        parentId: "1-3",
      },
      {
        id: "2",
        name: "Documentation",
        type: "folder",
        parentId: null,
      },
      { 
        id: "2-1", 
        name: "README.md", 
        type: "file",
        mimeType: "text/markdown",
        content: "# Project Documentation\n\n## Overview\nThis is a sample project demonstrating various features.\n\n## Getting Started\n1. Clone the repository\n2. Install dependencies\n3. Run the development server\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3",
        parentId: "2",
      },
      { 
        id: "2-2", 
        name: "API.md", 
        type: "file",
        mimeType: "text/markdown",
        content: "# API Documentation\n\n## Endpoints\n\n### GET /api/users\nReturns a list of users\n\n### POST /api/users\nCreates a new user\n\n### GET /api/users/:id\nReturns a specific user\n\n### PUT /api/users/:id\nUpdates a specific user\n\n### DELETE /api/users/:id\nDeletes a specific user",
        parentId: "2",
      },
      { 
        id: "3", 
        name: "package.json", 
        type: "file",
        mimeType: "application/json",
        content: "{\n  \"name\": \"project-name\",\n  \"version\": \"1.0.0\",\n  \"description\": \"A sample project\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"dev\": \"next dev\",\n    \"build\": \"next build\",\n    \"start\": \"next start\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.0.0\",\n    \"react-dom\": \"^18.0.0\",\n    \"next\": \"^13.0.0\"\n  }\n}",
        parentId: null,
      },
      { 
        id: "4", 
        name: "sample.txt", 
        type: "file",
        mimeType: "text/plain",
        content: "This is a plain text file.\n\nIt contains multiple lines of text with no special formatting.\n\nPlain text files are simple and can be opened by almost any text editor.",
        parentId: null,
      },
    ];

    try {
      // Save sample files to IndexedDB
      for (const file of sampleFiles) {
        await dbService.saveFile(file);
      }
      
      // Then load them back (as tree)
      const fileTree = buildFileTree(sampleFiles);
      setFiles(fileTree);
    } catch (error) {
      console.error("Error saving sample files:", error);
      // Just use in-memory if saving fails
      const fileTree = buildFileTree(sampleFiles);
      setFiles(fileTree);
    }
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const dbFiles = await dbService.getAllFiles();
      if (dbFiles && dbFiles.length > 0) {
        const fileTree = buildFileTree(dbFiles);
        setFiles(fileTree);
      } else {
        // If no files in DB, load sample files
        loadExampleFiles();
      }
    } catch (error) {
      console.error("Error loading files:", error);
      loadExampleFiles();
    }
  }, [loadExampleFiles]);

  // Initialize IndexedDB and load files
  useEffect(() => {
    // Only initialize IndexedDB in the browser
    if (!isBrowser) return;
    
    const initializeDB = async () => {
      setIsLoading(true);
      try {
        await dbService.initDB();
        await loadFiles();
      } catch (error) {
        console.error("Error initializing database:", error);
        // Add some example files if DB fails
        loadExampleFiles();
      } finally {
        setIsLoading(false);
      }
    };

    initializeDB();
  }, [loadFiles, loadExampleFiles]);

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

  // Upload a file to IndexedDB
  const uploadFile = async (file: File): Promise<void> => {
    if (!isBrowser) return;
    
    try {
      // Check if file is a PDF
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        // Read as data URL for PDF files
        try {
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const content = e.target?.result as string;
                
                if (!content) {
                  console.error("Failed to read PDF content");
                  reject(new Error("Failed to read PDF content"));
                  return;
                }
                
                console.log("PDF upload - content type:", typeof content);
                console.log("PDF upload - content starts with:", content.substring(0, 30));
                
                // Ensure file has an ID even if saving fails
                const fileId = generateUniqueId();
                
                const newFile: FileItem = {
                  id: fileId,
                  name: file.name,
                  type: "file",
                  mimeType: 'application/pdf',
                  content,
                  parentId: null
                };
                
                try {
                  await dbService.saveFile(newFile);
                  console.log("PDF file saved successfully:", file.name);
                  
                  // Refresh the file list
                  const dbFiles = await dbService.getAllFiles();
                  setFiles(buildFileTree(dbFiles));
                  
                  // Open the PDF file in a tab
                  openFileInTab(fileId);
                  resolve();
                } catch (dbError) {
                  console.error("Error saving PDF to IndexedDB:", dbError);
                  reject(new Error(`Error saving PDF: ${dbError}`));
                }
              } catch (error) {
                console.error("Error processing PDF:", error);
                reject(new Error(`Error processing PDF: ${error}`));
              }
            };
            
            reader.onerror = (event) => {
              console.error("Error reading PDF file:", event);
              reject(new Error("Failed to read PDF file"));
            };
            
            // Read as data URL - which produces a base64 encoded string
            reader.readAsDataURL(file);
          });
        } catch (error) {
          console.error("Error in PDF upload process:", error);
          throw error;
        }
      } else {
        // For text files
        try {
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const content = e.target?.result as string;
                
                // Ensure file has an ID even if saving fails
                const fileId = generateUniqueId();
                
                const newFile: FileItem = {
                  id: fileId,
                  name: file.name,
                  type: "file",
                  mimeType: file.type || getMimeTypeFromExtension(file.name),
                  content,
                  parentId: null
                };
                
                try {
                  await dbService.saveFile(newFile);
                  console.log("Text file saved successfully:", file.name);
                  
                  // Refresh the file list
                  const dbFiles = await dbService.getAllFiles();
                  setFiles(buildFileTree(dbFiles));
                  
                  // Open the text file in a tab
                  openFileInTab(fileId);
                  resolve();
                } catch (dbError) {
                  console.error("Error saving text file to IndexedDB:", dbError);
                  reject(new Error(`Error saving text file: ${dbError}`));
                }
              } catch (error) {
                console.error("Error processing text file:", error);
                reject(new Error(`Error processing text file: ${error}`));
              }
            };
            
            reader.onerror = (event) => {
              console.error("Error reading text file:", event);
              reject(new Error("Failed to read text file"));
            };
            
            reader.readAsText(file);
          });
        } catch (error) {
          console.error("Error in text file upload process:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in uploadFile function:", error);
      // Don't rethrow to prevent unhandled rejection
      return Promise.resolve(); // Silently fail but log the error
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

  // Function to delete a file or folder
  const deleteFile = async (fileId: string): Promise<void> => {
    if (!isBrowser) return Promise.resolve();
    
    try {
      // Find the file/folder
      const fileToDelete = findFileById(fileId, files);
      if (!fileToDelete) {
        console.error("File not found:", fileId);
        return Promise.resolve();
      }
      
      try {
        // Delete from IndexedDB
        await dbService.deleteFile(fileId);
        
        // If it's an open tab, close it
        const tabWithFile = openTabs.find(tab => tab.fileId === fileId);
        if (tabWithFile) {
          closeTab(tabWithFile.id);
        }
        
        // If it's the selected file, clear selection
        if (selectedFileId === fileId) {
          setSelectedFileId(null);
          setSelectedFile(null);
        }
        
        // Remove from state
        if (fileToDelete.parentId) {
          // It's a child item
          setFiles(prevFiles => {
            return updateFileTree(prevFiles, fileToDelete.parentId!, (parent) => {
              if (!parent.children) return parent;
              return {
                ...parent,
                children: parent.children.filter(child => child.id !== fileId)
              };
            });
          });
        } else {
          // It's a root item
          setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        }
        
        console.log("File deleted successfully:", fileToDelete.name);
      } catch (dbError) {
        console.error("Error with IndexedDB deletion:", dbError);
        throw new Error(`Failed to delete file from database: ${dbError}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      // Don't rethrow to prevent unhandled promise rejection
      return Promise.resolve();
    }
  };

  // Helper function to update an item in the file tree
  const updateFileTree = (
    files: FileItem[], 
    fileIdToUpdate: string, 
    updateFn: (file: FileItem) => FileItem
  ): FileItem[] => {
    return files.map(file => {
      if (file.id === fileIdToUpdate) {
        return updateFn(file);
      }
      
      if (file.type === 'folder' && file.children) {
        return {
          ...file,
          children: updateFileTree(file.children, fileIdToUpdate, updateFn)
        };
      }
      
      return file;
    });
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

  return (
    <FilesContext.Provider
      value={{
        files,
        expandedFolders,
        isLoading,
        selectedFileId,
        selectedFile,
        openTabs,
        activeTabId,
        toggleFolder,
        selectFile,
        openFileInTab,
        closeTab,
        setActiveTab,
        uploadFile,
        createFolder,
        deleteFile,
        refreshFile,
        findFileById
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}; 