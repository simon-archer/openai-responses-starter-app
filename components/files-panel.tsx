"use client";
import React from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { useFiles, FileItem } from "./context/files-context";

export default function FilesPanel() {
  const { 
    files, 
    expandedFolders, 
    isLoading, 
    toggleFolder, 
    selectFile, 
    selectedFileId,
    openFileInTab
  } = useFiles();

  const renderFileTree = (items: FileItem[], level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? 'pl-4' : ''}`}>
        {items.map(item => (
          <li key={item.id}>
            <div 
              className={`
                flex items-center py-1 px-2 rounded-md text-sm
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