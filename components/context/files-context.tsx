"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Sample data structure for files
export type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
};

interface FilesContextType {
  files: FileItem[];
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;
  toggleFolder: (id: string) => void;
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

  useEffect(() => {
    // Simulate loading files
    setTimeout(() => {
      setFiles([
        {
          id: "1",
          name: "Project Files",
          type: "folder",
          children: [
            { id: "1-1", name: "index.js", type: "file" },
            { id: "1-2", name: "styles.css", type: "file" },
            { 
              id: "1-3", 
              name: "components", 
              type: "folder",
              children: [
                { id: "1-3-1", name: "Header.jsx", type: "file" },
                { id: "1-3-2", name: "Footer.jsx", type: "file" },
              ]
            },
          ]
        },
        {
          id: "2",
          name: "Documentation",
          type: "folder",
          children: [
            { id: "2-1", name: "README.md", type: "file" },
            { id: "2-2", name: "API.md", type: "file" },
          ]
        },
        { id: "3", name: "package.json", type: "file" },
        { id: "4", name: "tsconfig.json", type: "file" },
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

  return (
    <FilesContext.Provider
      value={{
        files,
        expandedFolders,
        isLoading,
        toggleFolder
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}; 