"use client";
import React, { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";

// Sample data structure for files
type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileItem[];
};

export default function FilesPanel() {
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

  const renderFileTree = (items: FileItem[], level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? 'pl-4' : ''}`}>
        {items.map(item => (
          <li key={item.id}>
            <div 
              className={`
                flex items-center py-1 px-2 rounded-md text-sm
                ${item.type === 'folder' ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}
              `}
              onClick={() => item.type === 'folder' && toggleFolder(item.id)}
            >
              {item.type === 'folder' ? (
                <>
                  {expandedFolders[item.id] ? 
                    <ChevronDown size={16} className="mr-1.5" /> : 
                    <ChevronRight size={16} className="mr-1.5" />
                  }
                  <Folder size={16} className="mr-1.5 text-blue-500" />
                </>
              ) : (
                <File size={16} className="mr-1.5 ml-5 text-gray-500" />
              )}
              <span className="truncate">{item.name}</span>
            </div>
            {item.type === 'folder' && expandedFolders[item.id] && item.children && (
              renderFileTree(item.children, level + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 h-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p className="text-sm text-gray-500">Loading files...</p>
          </div>
        ) : (
          renderFileTree(files)
        )}
      </div>
    </div>
  );
} 