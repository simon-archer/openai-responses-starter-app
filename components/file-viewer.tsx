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

    // Handle PDF files
    if (activeFile.mimeType === 'application/pdf' || activeFile.name.toLowerCase().endsWith('.pdf')) {
      // Create object URL for PDF viewing
      try {
        // First, decode the base64 string
        const binaryString = atob(activeFile.content);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob and object URL
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        return (
          <div className="h-full w-full">
            <object
              data={url}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
                <p className="mb-4">Unable to display PDF directly.</p>
                <a
                  href={url}
                  download={activeFile.name}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Download PDF
                </a>
              </div>
            </object>
          </div>
        );
      } catch (error) {
        console.error('Error displaying PDF:', error);
        return (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
            <FileText size={48} strokeWidth={1} className="mb-4" />
            <p>Error displaying PDF file</p>
            <p className="text-sm mt-2 text-gray-400">The file might be corrupted or in an unsupported format</p>
          </div>
        );
      }
    }

    // Render text content
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