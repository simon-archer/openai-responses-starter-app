"use client";
import React, { useState, useRef, useEffect } from "react";
import { Folder, ChevronRight, ChevronDown, FileText, MoreVertical, Trash2, FileCode, FileJson, Settings, SlidersHorizontal, Link2, CloudOff, Cloud, Download, Loader2 } from "lucide-react";
import { useFiles, FileItem } from "./context/files-context";
import FileSearchSetup from "./file-search-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import FileService, { arrayBufferToBase64 as arrayBufferToBase64Util, getMimeTypeFromExtension } from "@/services/file-service";
import VectorStoreService from "@/services/vector-store-service";
import { useVectorStore } from "./context/vector-store-context";
import { toast } from "react-hot-toast";

// Get file icon based on file type/extension, now accepts processingFileId
function getFileIcon(fileName: string, mimeType?: string, file?: FileItem, processingFileId?: string | null) {
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
    const isPlaceholder = file.isPlaceholder;
    
    let statusIcon = null;
    let tooltipText = null;
    
    // Check if this specific file is being processed
    if (file.id === processingFileId) {
        statusIcon = <Loader2 size={16} className="animate-spin text-gray-500 mr-2" />;
        tooltipText = "Processing...";
    } else {
        // Determine status icon based on state if not processing
        if (isLinked && isPlaceholder) {
          statusIcon = <Cloud size={16} className="text-amber-500 mr-2" />;
          tooltipText = "Remote file (needs local content)";
        } else if (isLinked) {
          statusIcon = <Link2 size={16} className="text-blue-500 mr-2" />;
          tooltipText = "Linked to Vector Store";
        } else {
          statusIcon = <CloudOff size={16} className="text-gray-400 mr-2" />;
          tooltipText = "Local File Only";
        }
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {statusIcon}
              {icon}
            </div>
          </TooltipTrigger>
          {tooltipText && (
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return icon;
}

export default function FilesPanel() {
  const { 
    files: combinedFiles, 
    isLoading: isSyncing, 
    currentVectorStoreId, 
    syncFiles 
  } = useVectorStore();
  
  const { 
    expandedFolders, 
    toggleFolder, 
    selectFile, 
    selectedFileId,
    openFileInTab,
    setFiles: setLocalFilesState,
    openTabs,
    closeTab,
    findFileById,
    loadFiles: loadLocalFiles 
  } = useFiles();
  
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
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

  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (contextMenu.show) {
        setContextMenu(prev => ({ ...prev, show: false }));
      }
    };
    document.addEventListener("scroll", handleInteraction, true);
    window.addEventListener("resize", handleInteraction);
    return () => {
      document.removeEventListener("scroll", handleInteraction, true);
      window.removeEventListener("resize", handleInteraction);
    };
  }, [contextMenu.show]);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 100);
    setContextMenu({ show: true, x, y, fileId });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }));
  }

  const handleDeleteFile = async (fileId: string) => {
    closeContextMenu();
    const file = findFileById(fileId, combinedFiles);
    if (!file) return;

    const isPlaceholder = file.isPlaceholder;
    const isLinked = !!file.vectorStoreFileId;
    let message = "Are you sure you want to delete this file?";

    if (isPlaceholder) {
        message = "This will delete the remote file from the vector store. Are you sure?";
    } else if (isLinked) {
        message = "This will delete the file locally AND from the vector store. Are you sure?";
    }

    if (!confirm(message)) return;

    setProcessingFileId(fileId);
    try {
      let remoteDeletePromise = Promise.resolve();
      let localDeletePromise = Promise.resolve();

      if (isLinked && file.vectorStoreFileId) {
        console.log(`[FilesPanel] Deleting remote file ${file.vectorStoreFileId} for ${file.name}`);
        remoteDeletePromise = VectorStoreService.deleteFile(file.vectorStoreFileId)
          .then(() => console.log(`[FilesPanel] Remote file ${file.vectorStoreFileId} deleted.`))
          .catch(err => {
            console.error(`[FilesPanel] Error deleting remote file ${file.vectorStoreFileId}:`, err);
            toast.error(`Failed to delete remote file ${file.name}. It may still exist.`);
          });
      }
      
      if (!isPlaceholder) {
         console.log(`[FilesPanel] Deleting local file ${file.id} for ${file.name}`);
         localDeletePromise = FileService.deleteFile(file.id)
            .then(() => console.log(`[FilesPanel] Local file ${file.id} deleted.`))
            .catch(err => {
                 console.error(`[FilesPanel] Error deleting local file ${file.id}:`, err);
                 toast.error(`Failed to delete local file ${file.name}.`);
             });
      }

      await Promise.all([remoteDeletePromise, localDeletePromise]);

      const tabWithFile = openTabs.find(tab => tab.fileId === fileId);
      if (tabWithFile) {
        closeTab(tabWithFile.id);
      }
      if (selectedFileId === fileId) {
        selectFile("");
      }

      console.log("[FilesPanel] Triggering sync after delete operation.");
      await syncFiles();
      toast.success(`File ${file.name} deleted.`);

    } catch (error) {
      console.error("[FilesPanel] Unexpected error during delete orchestration:", error);
      toast.error("An unexpected error occurred during file deletion.");
    } finally {
      setProcessingFileId(null);
    }
  };

  const handleToggleVectorStore = async (fileId: string) => {
    closeContextMenu();
    const file = findFileById(fileId, combinedFiles);
    if (!file || file.isPlaceholder) {
      console.warn("[FilesPanel] Attempted to toggle link on a placeholder or non-existent file.");
      return;
    }

    console.log("[FilesPanel] Attempting to toggle vector store link for file:", file.name);
    
    const isLinked = !!file.vectorStoreFileId;
    const storeId = currentVectorStoreId;

    if (!isLinked && !storeId) {
      toast.error("Please connect to a vector store first in File Search Settings.");
      return;
    }

    const action = isLinked ? "Unlink" : "Link";
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} '${file.name}' ${isLinked ? 'from' : 'to'} the vector store?`)) {
        return;
    }

    setProcessingFileId(fileId);
    try {
      if (isLinked) {
        await VectorStoreService.unlinkFile(file); 
        toast.success(`File '${file.name}' unlinked.`);
      } else if (storeId) {
        await VectorStoreService.linkFile(file, storeId);
        toast.success(`File '${file.name}' linked.`);
      }
      
      console.log(`[FilesPanel] Triggering sync after ${action}.`);
      await syncFiles();
      
    } catch (error) {
      console.error(`[FilesPanel] Error ${action.toLowerCase()}ing file:`, error);
      toast.error(`Failed to ${action.toLowerCase()} file '${file.name}'.`);
    } finally {
      setProcessingFileId(null);
    }
  };
  
  const handleUploadLocalCopy = (placeholderFile: FileItem) => {
    closeContextMenu();
    if (!placeholderFile || !placeholderFile.isPlaceholder) return;

    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        setProcessingFileId(placeholderFile.id);
        const uploadedFile = target.files[0];
        console.log(`[FilesPanel] Uploading local copy for placeholder: ${placeholderFile.name}, New file: ${uploadedFile.name}`);
        
        try {
            const content = await uploadedFile.arrayBuffer();
            const base64Content = arrayBufferToBase64Util(content);
            
            const newLocalFile: FileItem = {
                id: placeholderFile.id.replace(/^placeholder-/, 'local-'),
                name: placeholderFile.name,
                path: placeholderFile.path,
                type: 'file',
                mimeType: uploadedFile.type || getMimeTypeFromExtension(uploadedFile.name),
                content: base64Content,
                parentId: placeholderFile.parentId,
                vectorStoreId: placeholderFile.vectorStoreId,
                vectorStoreFileId: placeholderFile.vectorStoreFileId,
                isVectorStoreFile: true,
                isPlaceholder: false,
                lastModified: new Date().toISOString(),
                children: undefined
            };

            await FileService.saveFile(newLocalFile);
            console.log(`[FilesPanel] Saved local file ${newLocalFile.id} for ${newLocalFile.name}.`);
            
            console.log("[FilesPanel] Triggering sync after uploading local copy.");
            await syncFiles();
            
            toast.success(`Local copy for '${newLocalFile.name}' uploaded.`);
            
        } catch (error) {
          console.error("[FilesPanel] Error uploading local copy:", error);
          toast.error(`Failed to upload local copy for ${placeholderFile.name}.`);
        } finally {
          setProcessingFileId(null);
          document.body.removeChild(input);
        }
      } else {
          document.body.removeChild(input);
      }
    });

    input.click();
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });
    
    return (
      <ul className={`space-y-1 ${level > 0 ? 'pl-4' : ''}`}>
        {sortedItems.map(item => (
          <li key={item.id}>
            <div 
              className={`
                flex items-center p-1 pl-2 rounded-md text-sm group w-full relative
                ${item.type === 'folder' ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${item.type === 'file' && item.id === selectedFileId ? 'bg-gray-200 dark:bg-gray-600 font-medium' : ''}
              `}
              onClick={() => {
                if (item.isPlaceholder) {
                    toast("This is a remote file. Upload a local copy via the context menu.");
                    return;
                }
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
                    {getFileIcon(item.name, item.mimeType, item, processingFileId)}
                  </span>
                )}
                <span className="truncate">{item.name}</span>
              </div>
              
              <button 
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-opacity flex-shrink-0 ml-auto"
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
    <div className="h-full w-full bg-white dark:bg-gray-800 flex flex-col relative text-gray-900 dark:text-gray-100">
      <div className="flex-1 overflow-y-auto p-3 h-full">
        {isSyncing ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 size={24} className="animate-spin text-gray-500" />
            <p className="text-sm text-gray-500 ml-2">Loading files...</p>
          </div>
        ) : combinedFiles.length > 0 ? (
          renderFileTree(combinedFiles)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pt-10">
            <Folder size={32} className="mb-2" />
            <p className="text-sm">No files found.</p>
            <p className="text-xs mt-1">Connect to a vector store or use the Upload button.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      <div className="p-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-sm font-medium p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <span className="flex items-center">
            <SlidersHorizontal size={14} className="mr-2" />
            File Search Settings
          </span>
          {showSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {showSettings && (
          <div className="pt-2 pb-1 pl-1 pr-1 border-t border-gray-100 dark:border-gray-700 mt-2">
            <FileSearchSetup />
          </div>
        )}
      </div>

      {contextMenu.show && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
        >
          <div
            ref={contextMenuRef}
            className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 min-w-[200px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const file = findFileById(contextMenu.fileId, combinedFiles);
              if (!file) return <div className="px-3 py-1.5 text-sm text-gray-500">Error: File not found</div>;
              
              const currentFile = file as FileItem;
              const isPlaceholder = currentFile.isPlaceholder;
              const isLinked = !!currentFile.vectorStoreFileId;
              const isStoreAvailable = !!currentVectorStoreId;
              const itemIsProcessing = processingFileId === currentFile.id;

              return (
                <>
                  {isPlaceholder && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleUploadLocalCopy(currentFile)}
                      disabled={!!processingFileId}
                    >
                      {itemIsProcessing ? 
                        <Loader2 size={14} className="mr-2 animate-spin" /> : 
                        <Download size={14} className="mr-2" />
                      }
                      Upload Local Copy
                    </button>
                  )}
                
                  {!isPlaceholder && (
                    <button
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center ${isStoreAvailable || isLinked ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleToggleVectorStore(currentFile.id)}
                      disabled={(!isStoreAvailable && !isLinked) || !!processingFileId}
                      title={!isStoreAvailable && !isLinked ? "Connect to vector store to link files." : (isLinked ? "Unlink file from vector store" : "Link file to vector store")}
                    >
                      {itemIsProcessing ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                      ) : isLinked ? (
                          <CloudOff size={14} className="mr-2" />
                      ) : (
                          <Link2 size={14} className={`mr-2 ${isStoreAvailable ? '' : 'text-gray-400'}`} />
                      )}
                      {isLinked ? "Unlink from Vector Store" : "Link to Vector Store"}
                    </button>
                  )}
                  
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDeleteFile(currentFile.id)}
                    disabled={!!processingFileId}
                  >
                     {itemIsProcessing ? 
                        <Loader2 size={14} className="mr-2 animate-spin" /> : 
                        <Trash2 size={14} className="mr-2" />
                      }
                    Delete
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
} 