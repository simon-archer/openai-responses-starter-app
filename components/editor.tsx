"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFiles } from "./context/files-context";
import { FileText, FileCode, FileJson, AlertCircle, X, Code, File, Save, Eye, Edit2, Edit } from "lucide-react";
import { dbService } from "@/lib/indexeddb-service";
import ReactMarkdown from 'react-markdown';

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
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end p-2 bg-gray-50 border-b">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center"
        >
          {isEditing ? (
            <>
              <Eye size={14} className="mr-1" />
              Preview
            </>
          ) : (
            <>
              <Edit2 size={14} className="mr-1" />
              Edit
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="markdown-body p-4 overflow-auto">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
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
      </div>
    );
  }
  
  // Only render iframe when we have valid content
  return (
    <div className="w-full h-full flex flex-col">
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
  );
}

// Get file icon based on file type/extension
function getFileIcon(fileName: string, mimeType?: string) {
  // Check for PDF files
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith('.pdf')) {
    return <FileText size={16} className="mr-2 text-red-500" />;
  }
  
  // Check for Word files
  if (mimeType === "application/msword" || 
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
    return <FileText size={16} className="mr-2 text-blue-700" />;
  }
  
  // Check for code files
  if (mimeType === "application/javascript" || mimeType === "application/typescript" || 
      mimeType?.includes("jsx") || mimeType?.includes("tsx") ||
      fileName.endsWith(".js") || fileName.endsWith(".jsx") || fileName.endsWith(".ts") || 
      fileName.endsWith(".tsx") || fileName.endsWith(".css") || fileName.endsWith(".html")) {
    return <FileCode size={16} className="mr-2 text-blue-500" />;
  }

  // Check for JSON files
  if (mimeType === "application/json" || fileName.endsWith(".json")) {
    return <FileJson size={16} className="mr-2 text-green-500" />;
  }

  // Check for markdown files
  if (mimeType === "text/markdown" || fileName.endsWith(".md")) {
    return <FileText size={16} className="mr-2 text-purple-500" />;
  }

  // Default file icon
  return <FileText size={16} className="mr-2 text-gray-500" />;
}

export default function Viewer() {
  const { 
    selectedFile, 
    openTabs, 
    activeTabId, 
    setActiveTab, 
    closeTab,
    refreshFile
  } = useFiles();
  
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState<Record<string, boolean>>({});
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Load content when selectedFile changes
  useEffect(() => {
    if (selectedFile && selectedFile.content !== undefined) {
      setFileContents(prev => ({
        ...prev,
        [selectedFile.id]: selectedFile.content || ''
      }));
    }
  }, [selectedFile]);
  
  // Make the save button and edit mode toggle accessible to other components
  useEffect(() => {
    // Expose the functionality via the DOM for parent components
    const handleExternalSave = () => {
      saveActiveFile();
    };

    const handleToggleEditMode = () => {
      if (!activeTabId) return;
      
      const activeTab = openTabs.find(tab => tab.id === activeTabId);
      if (activeTab) {
        toggleEditMode(activeTab.fileId);
      }
    };

    const handleDownloadFile = () => {
      if (!activeTabId) return;
      
      const activeTab = openTabs.find(tab => tab.id === activeTabId);
      if (activeTab && activeTab.fileId) {
        const content = fileContents[activeTab.fileId];
        if (content) {
          // Create a blob and download it
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = activeTab.fileName || 'download.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    };

    // Create global functions that can be called by other components
    const win = window as any;
    win._editorSaveFile = handleExternalSave;
    win._editorToggleEditMode = handleToggleEditMode;
    win._editorDownloadFile = handleDownloadFile;

    return () => {
      // Clean up when component unmounts
      delete win._editorSaveFile;
      delete win._editorToggleEditMode;
      delete win._editorDownloadFile;
    };
  }, [activeTabId, openTabs, fileContents]);

  // Check if file is editable
  const isFileEditable = (mimeType?: string, fileName?: string) => {
    // Files that are not editable
    if (!mimeType || !fileName) return false;
    
    if (mimeType === 'application/pdf') return false;
    if (mimeType === 'application/msword' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.toLowerCase().endsWith('.doc') || 
        fileName.toLowerCase().endsWith('.docx')) return false;
    
    // All other files are considered editable
    return true;
  };

  // Toggle edit mode for a file
  const toggleEditMode = (fileId: string) => {
    setIsEditMode(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  // Update file content in state
  const handleContentChange = useCallback((fileId: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [fileId]: content
    }));
  }, []);

  const handleSaveFile = async (fileId: string) => {
    // Validate inputs
    if (!fileId) {
      console.error("Cannot save: No fileId provided");
      return;
    }
    
    const content = fileContents[fileId];
    if (content === undefined) {
      console.error("Cannot save: No content found for fileId", fileId);
      return;
    }

    setIsSaving(true);
    console.log("Saving file:", fileId);
    
    try {
      // Get the current file
      const allFiles = await dbService.getAllFiles();
      console.log("Retrieved files from DB:", allFiles.length);
      
      const fileToUpdate = allFiles.find(f => f.id === fileId);
      
      if (!fileToUpdate) {
        throw new Error(`File with ID ${fileId} not found in database`);
      }
      
      console.log("Found file to update:", fileToUpdate.name);
      
      // Update the content
      const updatedFile = {
        ...fileToUpdate,
        content
      };
      
      // Save to IndexedDB
      console.log("Updating file in DB:", updatedFile.name);
      await dbService.updateFile(updatedFile);
      console.log("File saved successfully:", updatedFile.name);
      
      // Update the file in context to avoid requiring a refresh
      if (refreshFile) {
        refreshFile(updatedFile);
      }
      
      // Exit edit mode after saving
      setIsEditMode(prev => ({
        ...prev,
        [fileId]: false
      }));
      
      // Show a success indicator with React state
      setIsSaving(false);
      
      // Create temporary success notification
      const container = document.createElement('div');
      container.className = 'fixed bottom-4 right-4 z-50 bg-green-100 text-green-800 px-4 py-2 rounded shadow-lg';
      container.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>File saved successfully</span>
        </div>
      `;
      document.body.appendChild(container);
      
      setTimeout(() => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error saving file:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save file: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save the current active file
  const saveActiveFile = () => {
    if (!activeTabId) {
      console.log("No active tab to save");
      return;
    }
    
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      console.log("Saving file for tab:", activeTab.fileName);
      handleSaveFile(activeTab.fileId);
    } else {
      console.error("Active tab not found in openTabs:", activeTabId);
    }
  };

  const isPdfFile = (mimeType?: string) => {
    return mimeType === 'application/pdf';
  };

  // Modify the renderFileContent function to handle edit mode
  const renderFileContent = (fileId: string, mimeType?: string) => {
    const content = fileContents[fileId] || '';
    const isEditable = isFileEditable(mimeType, openTabs.find(tab => tab.fileId === fileId)?.fileName);
    const editMode = isEditMode[fileId] || false;
    
    if (!mimeType) return <div className="p-4">Unknown file type</div>;
    
    if (isPdfFile(mimeType)) {
      // For PDFs, we don't need to handle changes as they're not editable
      return <PdfViewer content={content} />;
    } else if (
      mimeType === "application/msword" || 
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileId.toLowerCase().endsWith('.doc') || 
      fileId.toLowerCase().endsWith('.docx')
    ) {
      // Word documents aren't directly viewable in the browser
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
          <FileText size={48} className="mb-4 text-blue-700" />
          <p className="font-medium mb-2">Word Document</p>
          <p className="text-sm">Word documents can be downloaded but not previewed</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-500 rounded border border-blue-200 hover:bg-blue-100"
            onClick={() => {
              // Let user download the file
              if (content && (content.startsWith('data:') || content.includes('base64'))) {
                const a = document.createElement('a');
                a.href = content;
                a.download = openTabs.find(tab => tab.fileId === fileId)?.fileName || 'document.docx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } else {
                alert('No file data available for download');
              }
            }}
          >
            Download Document
          </button>
        </div>
      );
    } else if (mimeType.startsWith('application/javascript') || 
        mimeType.startsWith('application/typescript') || 
        mimeType.includes('html') || 
        mimeType.includes('css') || 
        mimeType.includes('xml')) {
      // For code files, only show editor in edit mode
      return editMode ? (
        <CodeViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      ) : (
        <div className="w-full h-full overflow-auto">
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      );
    } else if (mimeType === 'text/markdown' || fileId.toLowerCase().endsWith('.md')) {
      // For markdown files, show editor in edit mode, markdown rendered otherwise
      return editMode ? (
        <textarea
          className="w-full h-full p-4 font-mono text-sm bg-slate-50 focus:outline-none resize-none"
          value={content}
          onChange={(e) => handleContentChange(fileId, e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="markdown-body p-4 overflow-auto">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    } else if (mimeType === 'application/json' || fileId.toLowerCase().endsWith('.json')) {
      // For JSON files
      return editMode ? (
        <JsonViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      ) : (
        <div className="w-full h-full overflow-auto">
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap">
            {syntaxHighlightJSON(content)}
          </pre>
        </div>
      );
    } else {
      // For other text files
      return editMode ? (
        <TextViewer 
          content={content}
          onChange={(value) => handleContentChange(fileId, value)}
        />
      ) : (
        <div className="w-full h-full overflow-auto">
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      );
    }
  };

  // Simple JSON syntax highlighting for view mode
  const syntaxHighlightJSON = (json: string) => {
    try {
      // Format the JSON with indentation
      const obj = JSON.parse(json);
      const formatted = JSON.stringify(obj, null, 2);
      return formatted;
    } catch (e) {
      // If JSON is invalid, return as-is
      return json;
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
              title={tab.fileName}
            >
              {getFileIcon(tab.fileName, tab.mimeType)}
              <span className="text-sm font-medium mr-1 truncate max-w-[100px]">{tab.fileName}</span>
              <button 
                className="ml-1 p-1 rounded-full hover:bg-gray-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label="Close tab"
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
        ref={saveButtonRef}
      />
      
      {/* Content area */}
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
            <div className="h-full">
              {openTabs.map(tab => {
                if (tab.id === activeTabId) {
                  return (
                    <div key={`content-${tab.id}`} className="h-full">
                      {renderFileContent(tab.fileId, tab.mimeType)}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 