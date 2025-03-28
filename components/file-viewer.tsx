"use client";
import React from "react";
import { FileText, FileCode, FileJson, X } from "lucide-react";
import { useFiles } from "./context/files-context";
import { TabItem, FileItem } from "./context/files-context";

// Helper function to get the appropriate icon for a file
function getFileIcon(file: FileItem) {
  const { mimeType, name } = file;
  
  if (mimeType === "application/javascript" || mimeType === "text/css" || 
      name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts") || 
      name.endsWith(".tsx") || name.endsWith(".css")) {
    return <FileCode size={16} className="mr-2 text-blue-500" />;
  }

  if (mimeType === "application/json" || name.endsWith(".json")) {
    return <FileJson size={16} className="mr-2 text-green-500" />;
  }

  return <FileText size={16} className="mr-2 text-gray-500" />;
}

export default function FileViewer() {
  const { 
    openTabs, 
    activeTabId, 
    setActiveTab, 
    closeTab,
    files,
    findFileById
  } = useFiles();

  if (openTabs.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
        <FileText size={48} strokeWidth={1} className="mb-4" />
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  // Get the active file by looking up the fileId
  const activeTab = openTabs.find(tab => tab.id === activeTabId);
  const activeFile = activeTab ? findFileById(activeTab.fileId, files) : null;

  // Helper to get file for a tab
  const getFileForTab = (tab: TabItem): FileItem | null => {
    return findFileById(tab.fileId, files);
  };

  const renderFileContent = () => {
    if (!activeFile) return null;

    // Show error message if file content is missing
    if (!activeFile.content) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
          <FileText size={48} strokeWidth={1} className="mb-4" />
          <p>No content available for this file</p>
        </div>
      );
    }

    // Render file content
    return (
      <div className="p-4 h-full overflow-auto">
        <pre className="text-sm font-mono whitespace-pre-wrap">{activeFile.content}</pre>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Tabs bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {openTabs.map(tab => {
          const file = getFileForTab(tab);
          if (!file) return null;
          
          return (
            <div 
              key={tab.id}
              className={`
                group flex items-center gap-1 px-3 py-2 text-sm border-r border-gray-200
                ${activeTabId === tab.id ? 'bg-white font-medium' : 'hover:bg-gray-100'}
              `}
            >
              <button
                className="flex items-center gap-1"
                onClick={() => setActiveTab(tab.id)}
              >
                {getFileIcon(file)}
                <span className="truncate max-w-[100px]">{file.name}</span>
              </button>
              <button
                className="ml-2 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* File content */}
      <div className="flex-1 overflow-hidden">
        {renderFileContent()}
      </div>
    </div>
  );
} 