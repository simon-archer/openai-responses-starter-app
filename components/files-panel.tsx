"use client";
import React, { useState, useRef, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, Trash2, MoreHorizontal, FileText, FileCode, FileJson } from "lucide-react";
import { useFiles, FileItem } from "./context/files-context";

// Get file icon based on file type/extension
function getFileIcon(fileName: string, mimeType?: string) {
  // Check for PDF files
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith('.pdf')) {
    return <FileText size={16} className="text-red-500" />;
  }
  
  // Check for code files
  if (mimeType === "application/javascript" || mimeType === "application/typescript" || 
      mimeType?.includes("jsx") || mimeType?.includes("tsx") ||
      fileName.endsWith(".js") || fileName.endsWith(".jsx") || fileName.endsWith(".ts") || 
      fileName.endsWith(".tsx") || fileName.endsWith(".css") || fileName.endsWith(".html")) {
    return <FileCode size={16} className="text-blue-500" />;
  }

  // Check for JSON files
  if (mimeType === "application/json" || fileName.endsWith(".json")) {
    return <FileJson size={16} className="text-green-500" />;
  }

  // Check for markdown files
  if (mimeType === "text/markdown" || fileName.endsWith(".md")) {
    return <FileText size={16} className="text-purple-500" />;
  }

  // Default file icon
  return <FileText size={16} className="text-gray-500" />;
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
    deleteFile
  } = useFiles();

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

  // Handle file delete with better error handling
  const handleDeleteFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Failed to delete file");
      }
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
                flex items-center py-1 px-2 rounded-md text-sm group
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
              title={item.name} // Add title for hover tooltip with full name
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
                <span className="ml-5 mr-1.5">
                  {getFileIcon(item.name, item.mimeType)}
                </span>
              )}
              <span className="truncate flex-1 max-w-[150px]">{item.name}</span>
              
              {/* File actions button */}
              <button 
                className="ml-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContextMenu(e, item.id);
                }}
                aria-label="File actions"
              >
                <MoreHorizontal size={14} />
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
        ) : (
          renderFileTree(files)
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