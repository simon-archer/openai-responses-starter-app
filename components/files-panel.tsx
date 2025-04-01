"use client";
import React, { useState, useRef, useEffect } from "react";
import { Folder, ChevronRight, ChevronDown, FileText, MoreVertical, Trash2, FileCode, FileJson, Settings, SlidersHorizontal, Link2, CloudOff } from "lucide-react";
import { useFiles, FileItem } from "./context/files-context";
import { useTools } from "./context/tools-context";
import FileSearchSetup from "./file-search-setup";
import PanelConfig from "./panel-config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Get file icon based on file type/extension
function getFileIcon(fileName: string, mimeType?: string, file?: FileItem) {
  let icon;
  
  // Check for Word files
  if (mimeType === "application/msword" || 
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
    icon = <FileText size={16} className="mr-2 text-blue-700" />; 
  }
  // Check for code files
  else if (mimeType === "application/javascript" || mimeType === "application/typescript" || 
      mimeType?.includes("jsx") || mimeType?.includes("tsx") ||
      fileName.endsWith(".js") || fileName.endsWith(".jsx") || fileName.endsWith(".ts") || 
      fileName.endsWith(".tsx") || fileName.endsWith(".css") || fileName.endsWith(".html")) {
    icon = <FileCode size={16} className="mr-2 text-blue-500" />;
  }
  // Check for JSON files
  else if (mimeType === "application/json" || fileName.endsWith(".json")) {
    icon = <FileJson size={16} className="mr-2 text-green-500" />;
  }
  // Check for markdown files
  else if (mimeType === "text/markdown" || fileName.endsWith(".md")) {
    icon = <FileText size={16} className="mr-2 text-purple-500" />;
  }
  // Default file icon
  else {
    icon = <FileText size={16} className="mr-2 text-gray-500" />;
  }

  // If we have file status info, wrap it with a tooltip
  if (file) {
    const isLinked = !!file.vectorStoreFileId;
    const statusIcon = isLinked ? (
      <Link2 size={16} className="text-blue-500 mr-2" />
    ) : (
      <CloudOff size={16} className="text-gray-400 mr-2" />
    );
    
    const tooltipText = isLinked ? "Linked to Vector Store" : "Local File Only";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {statusIcon}
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return icon;
}

export default function FilesPanel() {
  const { 
    files, 
    expandedFolders, 
    isLoading, 
    toggleFolder, 
    selectFile, 
    selectedFileId,
    openFileInTab,
    deleteFile,
    setFiles,
    currentVectorStoreId,
    linkFileToVectorStore,
    unlinkFileFromVectorStore
  } = useFiles();
  
  const { fileSearchEnabled, setFileSearchEnabled } = useTools();

  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    fileId: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    fileId: ""
  });

  const [showSettings, setShowSettings] = useState(false);

  // Ref for detecting clicks outside the context menu
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Also close context menu when scrolling or window resizing
  useEffect(() => {
    const handleScroll = () => {
      if (contextMenu.show) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    
    const handleResize = () => {
      if (contextMenu.show) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };

    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [contextMenu.show]);

  // Handle right-click on file/folder
  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Adjust menu position to ensure it stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 100);
    
    setContextMenu({
      show: true,
      x,
      y,
      fileId
    });
  };

  // Handle file delete with confirmation and error handling
  const handleDeleteFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const message = file.vectorStoreFileId 
      ? "This will delete the file both locally and from the vector store. Are you sure?"
      : "Are you sure you want to delete this file?";

    if (confirm(message)) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Failed to delete file");
      }
    }
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // Handle linking/unlinking file to/from vector store
  const handleToggleVectorStore = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    console.log("[FilesPanel] Attempting to toggle vector store for file:", file);
    console.log("[FilesPanel] Current vector store ID:", currentVectorStoreId);
    console.log("[FilesPanel] File search enabled:", fileSearchEnabled);

    try {
      if (file.vectorStoreFileId) {
        // Unlink from vector store
        if (confirm("Are you sure you want to unlink this file from the vector store?")) {
          await unlinkFileFromVectorStore(fileId);
        }
      } else {
        // Link to vector store
        if (!currentVectorStoreId) {
          console.log("[FilesPanel] No vector store ID found in files context");
          alert("Please set up a vector store first in the File Search Settings.");
          return;
        }
        await linkFileToVectorStore(fileId);
      }
    } catch (error) {
      console.error("Error toggling vector store:", error);
      alert(file.vectorStoreFileId 
        ? "Failed to unlink file from vector store" 
        : "Failed to link file to vector store");
    }
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? 'pl-4' : ''}`}>
        {items.map(item => (
          <li key={item.id}>
            <div 
              className={`
                flex items-center p-1 pl-2 rounded-md text-sm group w-full
                ${item.type === 'folder' ? 'cursor-pointer hover:bg-gray-100' : 'cursor-pointer hover:bg-gray-100'}
                ${item.type === 'file' && item.id === selectedFileId ? 'bg-gray-100 font-medium' : ''}
              `}
              onClick={() => {
                if (item.type === 'folder') {
                  toggleFolder(item.id);
                } else {
                  selectFile(item.id);
                  openFileInTab(item.id);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, item.id)}
              title={item.name}
            >
              <div className="flex items-center min-w-0 flex-1">
                {item.type === 'folder' ? (
                  <>
                    {expandedFolders[item.id] ? 
                      <ChevronDown size={16} className="mr-1.5 flex-shrink-0" /> : 
                      <ChevronRight size={16} className="mr-1.5 flex-shrink-0" />
                    }
                    <Folder size={16} className="mr-1.5 flex-shrink-0 text-blue-500" />
                  </>
                ) : (
                  <span className="flex-shrink-0 flex items-center mr-1.5">
                    {getFileIcon(item.name, item.mimeType, item)}
                  </span>
                )}
                <span className="truncate">{item.name}</span>
              </div>
              
              {/* File actions button */}
              <button 
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full transition-opacity flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContextMenu(e, item.id);
                }}
                aria-label="File actions"
              >
                <MoreVertical size={14} />
              </button>
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
    <div className="h-full w-full bg-white flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-3 h-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p className="text-sm text-gray-500">Loading files...</p>
          </div>
        ) : files.length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-10">
            <Folder size={32} className="mb-2" />
            <p className="text-sm">No files uploaded yet.</p>
            <p className="text-xs mt-1">Use the Upload button above.</p>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200"></div>

      {/* Settings Area */}
      <div className="p-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-sm font-medium p-1.5 rounded hover:bg-gray-100 text-gray-600"
        >
          <span className="flex items-center">
            <SlidersHorizontal size={14} className="mr-2" />
            File Search Settings
          </span>
          {showSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {showSettings && (
          <div className="pt-2 pb-1 pl-1 pr-1 border-t border-gray-100 mt-2">
            <PanelConfig
              title="File Search"
              tooltip="Allows searching content within uploaded files"
              enabled={fileSearchEnabled}
              setEnabled={setFileSearchEnabled}
            >
              <FileSearchSetup />
            </PanelConfig>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          ref={contextMenuRef}
          className="fixed bg-white shadow-md rounded-md py-1 z-50 border border-gray-200"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Vector Store Link/Unlink Button */}
          {(() => {
            const file = files.find(f => f.id === contextMenu.fileId);
            if (!file || file.type !== 'file') return null;
            
            return (
              <button
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => handleToggleVectorStore(contextMenu.fileId)}
              >
                {file.vectorStoreFileId ? (
                  <>
                    <CloudOff size={14} className="mr-2" />
                    Unlink from Vector Store
                  </>
                ) : (
                  <>
                    <Link2 size={14} className="mr-2" />
                    Link to Vector Store
                  </>
                )}
              </button>
            );
          })()}
          
          {/* Delete Button */}
          <button
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center text-red-600"
            onClick={() => handleDeleteFile(contextMenu.fileId)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
} 