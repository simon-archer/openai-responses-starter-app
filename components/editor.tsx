"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFiles, FileItem, TabItem } from "./context/files-context";
import { FileText, FileCode, FileJson, X } from "lucide-react";
import { dbService } from "@/lib/indexeddb-service";
import ReactMarkdown from "react-markdown";

// Reusable Code Viewer component
function CodeViewer({ content }: { content: string }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 overflow-auto h-full">
      <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
        {content}
      </pre>
    </div>
  );
}

// Reusable TextViewer component
function TextViewer({ content }: { content: string }) {
  return (
    <div className="p-4 overflow-auto h-full">
      <pre className="whitespace-pre-wrap break-words text-gray-800 text-sm">
        {content}
      </pre>
    </div>
  );
}

// Markdown Viewer component
function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="p-4 overflow-auto h-full prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          p: ({node: _node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ul: ({node: _node, ...props}) => <ul className="mb-3 last:mb-0 pl-5" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ol: ({node: _node, ...props}) => <ol className="mb-3 last:mb-0 pl-5" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          pre: ({node: _node, ...props}) => <pre className="mb-3 last:mb-0 p-2 bg-gray-100 overflow-x-auto rounded text-xs" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          code: ({node: _node, className, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className?.includes('language-');
            return isInline 
              ? <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />
              : <code className="block" {...props} />;
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h1: ({node: _node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h2: ({node: _node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h3: ({node: _node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Reusable JsonViewer component
function JsonViewer({ content }: { content: string }) {
  try {
    const jsonObj = JSON.parse(content);
    const formattedJson = JSON.stringify(jsonObj, null, 2);
    return (
      <div className="p-4 overflow-auto h-full">
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
          {formattedJson}
        </pre>
      </div>
    );
  } catch {
    return (
      <div className="p-4 overflow-auto h-full">
        <div className="flex items-center text-red-500 mb-2">
          <span>Invalid JSON</span>
        </div>
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
          {content}
        </pre>
      </div>
    );
  }
}

// Component for displaying PDFs
function PdfViewer({ content }: { content: string }) {
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [pdfObjectURL, setPdfObjectURL] = useState<string | null>(null);

  useEffect(() => {
    // Clean up previous object URL if it exists
    if (pdfObjectURL) {
      URL.revokeObjectURL(pdfObjectURL);
      setPdfObjectURL(null);
    }

    if (!content) {
      setError("No PDF content available");
      setDebugInfo("Content is empty");
      return;
    }

    try {
      let base64Data = content;

      // If content includes the data URL prefix, extract just the base64 part
      if (content.includes('base64,')) {
        const base64Match = content.match(/base64,(.+)$/);
        if (base64Match && base64Match[1]) {
          base64Data = base64Match[1];
        }
      }
      
      // Check if the content looks like base64 (starts with common PDF base64 patterns)
      if (base64Data.startsWith('JVBERi')) {
        try {
          // Convert base64 to binary
          const binaryData = atob(base64Data);
          const array = new Uint8Array(binaryData.length);
          
          // Fill the array with byte values
          for (let i = 0; i < binaryData.length; i++) {
            array[i] = binaryData.charCodeAt(i);
          }
          
          // Create blob and object URL
          const blob = new Blob([array], { type: 'application/pdf' });
          const objectURL = URL.createObjectURL(blob);
          
          // Set the object URL as the source
          setPdfObjectURL(objectURL);
          setError(null);
          setDebugInfo("Successfully created object URL from raw base64 PDF data");
          return;
        } catch (e) {
          console.error("Error converting base64 to blob:", e);
          setDebugInfo(`Base64 conversion error: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        setDebugInfo("Content doesn't appear to be base64-encoded PDF data");
      }

      // If we reached here, the content format wasn't recognized
      setError("Unable to display PDF");
      if (!debugInfo) {
        setDebugInfo(`Content format not recognized. Content starts with: ${content.substring(0, 30)}...`);
      }
    } catch (e) {
      setError("Error processing PDF");
      setDebugInfo(`Exception: ${e instanceof Error ? e.message : String(e)}`);
      console.error("PDF processing error:", e);
    }
  }, [content]);

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfObjectURL) {
        URL.revokeObjectURL(pdfObjectURL);
      }
    };
  }, [pdfObjectURL]);

  // Show error state if we have an error or no content
  if (error || !pdfObjectURL) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <FileText size={48} className="mb-4" />
        <p className="text-red-500 font-medium mb-2">{error || "Failed to process PDF data"}</p>
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 text-xs font-mono max-w-md overflow-auto rounded">
            <p className="mb-2 font-semibold">Debug information:</p>
            <p className="whitespace-pre-wrap break-all">{debugInfo}</p>
          </div>
        )}
      </div>
    );
  }
  
  // Only render iframe when we have valid content
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <object
          data={pdfObjectURL}
          type="application/pdf"
          className="w-full h-full"
        >
          <iframe 
            src={pdfObjectURL} 
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        </object>
      </div>
    </div>
  );
}

// Helper to get the correct viewer component based on file
function getFileViewerComponent(file: FileItem | null) {
  if (!file || !file.content) {
    return TextViewer; // Default or show an error/placeholder
  }

  const { mimeType, name } = file;

  if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    return PdfViewer;
  }
  
  if (mimeType === "application/javascript" || name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts") || name.endsWith(".tsx")) {
    return CodeViewer;
  }

  if (mimeType === "text/css" || name.endsWith(".css")) {
    return CodeViewer;
  }

  if (mimeType === "application/json" || name.endsWith(".json")) {
    return JsonViewer;
  }
  
  if (mimeType === "text/markdown" || name.toLowerCase().endsWith('.md')) {
    return MarkdownViewer;
  }

  return TextViewer;
}

// Main Viewer component
export default function Viewer() {
  const { 
    openTabs, 
    activeTabId, 
    setActiveTab, 
    closeTab,
    files,
    findFileById,
    refreshFile
  } = useFiles();

  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const activeTab = openTabs.find(tab => tab.id === activeTabId);
  const activeFile = activeTab ? findFileById(activeTab.fileId, files) : null;

  // Load initial content when active file changes or edit mode is toggled
  useEffect(() => {
    if (activeFile?.content) {
      setEditedContent(activeFile.content);
    } else {
      setEditedContent(null);
    }
  }, [activeFile, editMode]);

  // Function to save the currently active file
  const saveActiveFile = useCallback(async () => {
    if (!activeFile || editedContent === null) return;

    console.log("Saving file:", activeFile.name);
    try {
      const updatedFile = { ...activeFile, content: editedContent };
      await dbService.updateFile(updatedFile);
      console.log("File updated successfully in DB:", updatedFile.name);
      
      refreshFile(updatedFile);
      setEditMode(false);
      
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }, [activeFile, editedContent, refreshFile]);

  // Expose save function to the window object
  useEffect(() => {
    const win = window as any;
    win._editorSaveFile = saveActiveFile;
    return () => {
      delete win._editorSaveFile;
    };
  }, [saveActiveFile]);

  // Handle toggling edit mode
  const handleToggleEditMode = useCallback(() => {
    if (!activeFile || activeFile.mimeType === 'application/pdf') {
      console.log("Editing not supported for this file type or no file is active.");
      return;
    }
    setEditMode(prev => {
      const nextEditMode = !prev;
      // Reset edited content if exiting edit mode without saving
      if (!nextEditMode && activeFile?.content) {
        setEditedContent(activeFile.content);
      }
      return nextEditMode;
    });
  }, [activeFile]);

  // Expose toggle edit mode function to the window object
  useEffect(() => {
    const win = window as any;
    win._editorToggleEditMode = handleToggleEditMode;
    return () => {
      delete win._editorToggleEditMode;
    };
  }, [handleToggleEditMode]);

  // Handle downloading the active file
  const handleDownloadFile = useCallback(() => {
    if (!activeFile || !activeFile.content) return;

    const blob = new Blob([activeFile.content], { type: activeFile.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeFile]);

  // Expose download function to the window object
  useEffect(() => {
    const win = window as any;
    win._editorDownloadFile = handleDownloadFile;
    return () => {
      delete win._editorDownloadFile;
    };
  }, [handleDownloadFile]);

  // Helper to get file for a tab
  const getFileForTab = (tab: TabItem): FileItem | null => {
    return findFileById(tab.fileId, files);
  };
  
  // Helper function to get the appropriate icon for a file
  function getFileIcon(file: FileItem) {
    const { mimeType, name } = file;
    
    if (mimeType === "application/javascript" || mimeType === "text/css" || 
        name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts") || 
        name.endsWith(".tsx") || name.endsWith(".css")) {
      return <FileCode size={16} className="mr-1" />;
    }

    if (mimeType === "application/json" || name.endsWith(".json")) {
      return <FileJson size={16} className="mr-1" />;
    }

    return <FileText size={16} className="mr-1" />;
  }

  // Determine which viewer component to use
  const ViewerComponent = getFileViewerComponent(activeFile);
  
  if (openTabs.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 bg-white">
        <FileText size={48} strokeWidth={1} className="mb-4" />
        <p>Select or upload a file to view</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const file = getFileForTab(tab);
          if (!file) return null;
          
          return (
            <div 
              key={tab.id} 
              className={`
                flex items-center border-r px-2 py-1.5 cursor-pointer text-xs
                ${isActive ? 'bg-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
              `}
              onClick={() => setActiveTab(tab.id)}
              title={tab.fileName}
            >
              {getFileIcon(file)}
              <span className="font-medium mr-1 truncate max-w-[120px]">{tab.fileName}</span>
              <button 
                className="ml-0.5 p-0.5 rounded-full hover:bg-gray-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label="Close tab"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Hidden save button with data attribute for panel selector to use */}
      <button 
        className="hidden"
        data-editor-save
        onClick={saveActiveFile}
        ref={saveButtonRef}
      />
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          editMode ? (
            <textarea
              className="w-full h-full p-4 border-none resize-none focus:outline-none font-mono text-sm"
              value={editedContent || ''}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <ViewerComponent content={activeFile.content || ''} />
          )
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
            <FileText size={48} strokeWidth={1} className="mb-4" />
            <p>Select a file to view</p>
          </div>
        )}
      </div>
    </div>
  );
} 