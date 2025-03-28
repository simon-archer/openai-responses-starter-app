"use client";
import React from "react";
import { useFiles } from "./context/files-context";
import { FileText, FileCode, FileJson, AlertCircle, X } from "lucide-react";

// Component for displaying code with syntax highlighting-like styling
function CodeViewer({ content, language }: { content: string; language: string }) {
  return (
    <div className="p-4 rounded-md bg-gray-50 border border-gray-200 overflow-auto h-full">
      <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
        {content}
      </pre>
    </div>
  );
}

// Component for displaying markdown-like content
function MarkdownViewer({ content }: { content: string }) {
  // Very simple markdown-like formatting
  const formattedContent = content
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-4">{line.substring(2)}</h1>;
      } 
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mb-3">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mb-2">{line.substring(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>;
      }
      if (line === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });

  return (
    <div className="p-4 overflow-auto h-full prose prose-sm max-w-none">
      {formattedContent}
    </div>
  );
}

// Component for displaying plain text
function TextViewer({ content }: { content: string }) {
  return (
    <div className="p-4 overflow-auto h-full">
      <pre className="whitespace-pre-wrap break-words text-gray-800 text-sm">
        {content}
      </pre>
    </div>
  );
}

// Component for displaying JSON
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
  } catch (e) {
    return (
      <div className="p-4 overflow-auto h-full">
        <div className="flex items-center text-red-500 mb-2">
          <AlertCircle size={16} className="mr-2" />
          <span>Invalid JSON</span>
        </div>
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
          {content}
        </pre>
      </div>
    );
  }
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

  if (openTabs.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
        <FileText size={48} strokeWidth={1} className="mb-4" />
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  const activeFile = openTabs.find(tab => tab.id === activeTabId)?.fileItem || null;

  const renderFileContent = () => {
    if (!activeFile) return null;
    
    const { content, mimeType, name } = activeFile;
    
    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <AlertCircle size={32} className="mb-2" />
          <p>No content available for this file</p>
        </div>
      );
    }

    // Determine file type based on mimeType or file extension
    if (mimeType === "application/javascript" || name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts") || name.endsWith(".tsx")) {
      return <CodeViewer content={content} language="javascript" />;
    }

    if (mimeType === "text/css" || name.endsWith(".css")) {
      return <CodeViewer content={content} language="css" />;
    }

    if (mimeType === "text/markdown" || name.endsWith(".md")) {
      return <MarkdownViewer content={content} />;
    }

    if (mimeType === "application/json" || name.endsWith(".json")) {
      return <JsonViewer content={content} />;
    }

    // Default to plain text
    return <TextViewer content={content} />;
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Tabs bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {openTabs.map(tab => (
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
              {getFileIcon(tab.fileItem)}
              <span className="truncate max-w-[100px]">{tab.fileItem.name}</span>
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
        ))}
      </div>
      
      {/* File content */}
      <div className="flex-1 overflow-hidden">
        {renderFileContent()}
      </div>
    </div>
  );
} 