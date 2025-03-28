"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Sample data structure for files
export type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
  mimeType?: string; // To help determine how to display the file
  content?: string; // Sample content for demo purposes
};

export type TabItem = {
  id: string;
  fileItem: FileItem;
};

interface FilesContextType {
  files: FileItem[];
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;
  selectedFileId: string | null;
  selectedFile: FileItem | null;
  openTabs: TabItem[];
  activeTabId: string | null;
  toggleFolder: (id: string) => void;
  selectFile: (id: string) => void;
  openFileInTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error("useFiles must be used within a FilesProvider");
  }
  return context;
};

export const FilesProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading files
    setTimeout(() => {
      setFiles([
        {
          id: "1",
          name: "Project Files",
          type: "folder",
          children: [
            { 
              id: "1-1", 
              name: "index.js", 
              type: "file", 
              mimeType: "application/javascript",
              content: "// JavaScript code\nconst app = {};\nconsole.log('Hello world');\n\nfunction example() {\n  return 'This is a code sample';\n}"
            },
            { 
              id: "1-2", 
              name: "styles.css", 
              type: "file",
              mimeType: "text/css",
              content: "/* CSS styles */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  color: #333;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}"
            },
            { 
              id: "1-3", 
              name: "components", 
              type: "folder",
              children: [
                { 
                  id: "1-3-1", 
                  name: "Header.jsx", 
                  type: "file",
                  mimeType: "text/jsx",
                  content: "import React from 'react';\n\nexport default function Header() {\n  return (\n    <header className=\"header\">\n      <h1>Project Title</h1>\n      <nav>\n        <ul>\n          <li><a href=\"#\">Home</a></li>\n          <li><a href=\"#\">About</a></li>\n          <li><a href=\"#\">Contact</a></li>\n        </ul>\n      </nav>\n    </header>\n  );\n}"
                },
                { 
                  id: "1-3-2", 
                  name: "Footer.jsx", 
                  type: "file",
                  mimeType: "text/jsx",
                  content: "import React from 'react';\n\nexport default function Footer() {\n  return (\n    <footer className=\"footer\">\n      <p>&copy; {new Date().getFullYear()} Project Name</p>\n    </footer>\n  );\n}"
                },
              ]
            },
          ]
        },
        {
          id: "2",
          name: "Documentation",
          type: "folder",
          children: [
            { 
              id: "2-1", 
              name: "README.md", 
              type: "file",
              mimeType: "text/markdown",
              content: "# Project Documentation\n\n## Overview\nThis is a sample project demonstrating various features.\n\n## Getting Started\n1. Clone the repository\n2. Install dependencies\n3. Run the development server\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3"
            },
            { 
              id: "2-2", 
              name: "API.md", 
              type: "file",
              mimeType: "text/markdown",
              content: "# API Documentation\n\n## Endpoints\n\n### GET /api/users\nReturns a list of users\n\n### POST /api/users\nCreates a new user\n\n### GET /api/users/:id\nReturns a specific user\n\n### PUT /api/users/:id\nUpdates a specific user\n\n### DELETE /api/users/:id\nDeletes a specific user"
            },
          ]
        },
        { 
          id: "3", 
          name: "package.json", 
          type: "file",
          mimeType: "application/json",
          content: "{\n  \"name\": \"project-name\",\n  \"version\": \"1.0.0\",\n  \"description\": \"A sample project\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"dev\": \"next dev\",\n    \"build\": \"next build\",\n    \"start\": \"next start\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.0.0\",\n    \"react-dom\": \"^18.0.0\",\n    \"next\": \"^13.0.0\"\n  }\n}"
        },
        { 
          id: "4", 
          name: "sample.txt", 
          type: "file",
          mimeType: "text/plain",
          content: "This is a plain text file.\n\nIt contains multiple lines of text with no special formatting.\n\nPlain text files are simple and can be opened by almost any text editor."
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
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

  const selectFile = (id: string) => {
    setSelectedFileId(id);
    const file = findFileById(id, files);
    setSelectedFile(file);
  };

  const openFileInTab = (fileId: string) => {
    const file = findFileById(fileId, files);
    if (!file || file.type !== 'file') return;

    // Check if tab already exists
    const existingTabIndex = openTabs.findIndex(tab => tab.id === fileId);
    
    if (existingTabIndex !== -1) {
      // Tab already exists, make it active
      setActiveTabId(fileId);
    } else {
      // Create new tab
      const newTab: TabItem = {
        id: fileId,
        fileItem: file
      };
      
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(fileId);
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

    // If we're closing the active tab, activate another tab
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Activate the tab to the left, or the first tab if we're closing the first tab
        const newActiveIndex = Math.max(0, tabIndex - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
        setSelectedFileId(newTabs[newActiveIndex].id);
        setSelectedFile(newTabs[newActiveIndex].fileItem);
      } else {
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
    setSelectedFileId(tabId);
    setSelectedFile(tab.fileItem);
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
        setActiveTab
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}; 