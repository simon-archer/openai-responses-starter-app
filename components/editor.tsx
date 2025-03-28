"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useFiles } from "./context/files-context";
import { FileText, FileCode, FileJson, AlertCircle, X, Code, File, Save } from "lucide-react";
import { dbService } from "@/lib/indexeddb-service";

// Component for displaying code with syntax highlighting-like styling
function CodeViewer({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  return (
    <div className="w-full h-full">
      <textarea
        className="w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

// Component for displaying markdown-like content
function MarkdownViewer({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  return (
    <div className="w-full h-full">
      <textarea
        className="w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

// Component for displaying plain text
function TextViewer({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  return (
    <div className="w-full h-full">
      <textarea
        className="w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

// Component for displaying JSON
function JsonViewer({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Validate JSON
      JSON.parse(content);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [content]);

  return (
    <div className="w-full h-full relative">
      <textarea
        className={`w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none ${error ? 'border-red-500' : ''}`}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-800 p-2 text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  );
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
      // Try to convert base64 content to Blob for more reliable display
      if (content.includes('base64')) {
        // Extract the base64 part from the data URL
        const base64Match = content.match(/base64,(.+)$/);
        
        if (base64Match && base64Match[1]) {
          const base64Data = base64Match[1];
          
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
            setDebugInfo("Successfully created object URL");
            return;
          } catch (e) {
            console.error("Error converting base64 to blob:", e);
            setDebugInfo(`Base64 conversion error: ${e instanceof Error ? e.message : String(e)}`);
          }
        } else {
          setDebugInfo("Couldn't extract base64 data from content");
        }
      }

      // If we reached here, either the content is not in base64 format
      // or there was an error processing it
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

  // Handle download click
  const handleDownload = () => {
    if (!content) return;
    
    try {
      // If we have an object URL, use that for download
      const downloadUrl = pdfObjectURL || content;
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading PDF:", e);
      alert("Failed to download PDF");
    }
  };

  // Show error state if we have an error or no content
  if (error || !pdfObjectURL) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <FileText size={48} className="mb-4" />
        <p className="text-red-500 font-medium mb-2">Error loading PDF</p>
        <p className="text-sm">{error || "Failed to process PDF data"}</p>
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 text-xs font-mono max-w-md overflow-auto rounded">
            <p className="mb-2 font-semibold">Debug information:</p>
            <p className="whitespace-pre-wrap break-all">{debugInfo}</p>
          </div>
        )}
        
        <button 
          onClick={handleDownload}
          className="mt-4 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Download PDF anyway
        </button>
      </div>
    );
  }
  
  // Only render iframe when we have valid content
  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-100 p-2 flex justify-between items-center">
        <span className="text-sm font-medium">PDF Document</span>
        <button 
          onClick={handleDownload}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Download PDF
        </button>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
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

function getFileIcon(file: { mimeType?: string; name: string }) {
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

export default function Editor() {
  const { 
    selectedFile, 
    openTabs, 
    activeTabId, 
    setActiveTab, 
    closeTab 
  } = useFiles();
  
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load content when selectedFile changes
  useEffect(() => {
    if (selectedFile && selectedFile.content !== undefined) {
      setFileContents(prev => ({
        ...prev,
        [selectedFile.id]: selectedFile.content || ''
      }));
    }
  }, [selectedFile]);

  // Update file content in state
  const handleContentChange = useCallback((fileId: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [fileId]: content
    }));
  }, []);

  const handleSaveFile = async (fileId: string) => {
    const content = fileContents[fileId];
    if (content === undefined) return;

    setIsSaving(true);
    
    try {
      // Get the current file
      const allFiles = await dbService.getAllFiles();
      const fileToUpdate = allFiles.find(f => f.id === fileId);
      
      if (fileToUpdate) {
        // Update the content
        const updatedFile = {
          ...fileToUpdate,
          content
        };
        
        // Save to IndexedDB
        await dbService.updateFile(updatedFile);
        console.log("File saved successfully:", updatedFile.name);
        
        // Optional: Show a small success indicator
        const saveIndicator = document.createElement('div');
        saveIndicator.className = 'fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow-md';
        saveIndicator.innerText = 'File saved successfully';
        document.body.appendChild(saveIndicator);
        
        setTimeout(() => {
          document.body.removeChild(saveIndicator);
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  // Save the current active file - exposed via data attribute
  const saveActiveFile = () => {
    if (!activeTabId) return;
    
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      handleSaveFile(activeTab.fileId);
    }
  };

  const isPdfFile = (mimeType?: string) => {
    return mimeType === 'application/pdf';
  };

  const renderFileContent = (fileId: string, mimeType?: string) => {
    const content = fileContents[fileId] || '';
    
    if (!mimeType) return <div className="p-4">Unknown file type</div>;
    
    if (isPdfFile(mimeType)) {
      // For PDFs, we don't need to handle changes as they're not editable
      return <PdfViewer content={content} />;
    } else if (mimeType.startsWith('application/javascript') || 
        mimeType.startsWith('application/typescript') || 
        mimeType.includes('html') || 
        mimeType.includes('css') || 
        mimeType.includes('xml')) {
      return (
        <CodeViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      );
    } else if (mimeType === 'text/markdown') {
      return (
        <MarkdownViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      );
    } else if (mimeType === 'application/json') {
      return (
        <JsonViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      );
    } else {
      return (
        <TextViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      );
    }
  };

  // If no file is selected
  if (openTabs.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <File size={48} className="mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No files are open</p>
          <p className="text-sm text-gray-400">Click on a file in the Files panel to open it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const fileId = tab.fileId;
          
          return (
            <div 
              key={tab.id} 
              className={`
                flex items-center border-r px-3 py-2 cursor-pointer
                ${isActive ? 'bg-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <Code size={14} className="mr-2" />
              <span className="text-sm font-medium mr-1">{tab.fileName}</span>
              <button 
                className="ml-1 p-1 rounded-full hover:bg-gray-200"
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
      
      {/* Hidden save button with data attribute for panel selector to use */}
      <button 
        className="hidden"
        data-editor-save
        onClick={saveActiveFile}
      />
      
      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        {activeTabId && (
          <>
            {/* Save indicator */}
            {isSaving && (
              <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Saving...
              </div>
            )}
            
            {/* File content */}
            {openTabs.map(tab => {
              if (tab.id === activeTabId) {
                return (
                  <div key={tab.id} className="h-full">
                    {renderFileContent(tab.fileId, tab.mimeType)}
                  </div>
                );
              }
              return null;
            })}
          </>
        )}
      </div>
    </div>
  );
} 