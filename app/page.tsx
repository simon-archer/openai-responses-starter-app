"use client";
import { Menu, X, ChevronDown, Upload, FolderPlus, Save, MessageCircle, MessageSquare, Wrench, FolderOpen, Check, FileText, PlusCircle, Trash2, Copy, Maximize2, RefreshCw, Globe, Code, Download, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ResizeCallbackData } from "react-resizable";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import ConversationSidebar from "@/components/conversation-sidebar";
import ResizablePanel from "@/components/resizable-panel";
import FilesPanel from "@/components/files-panel";
import Viewer from "@/components/editor";
import { useFiles, TabItem } from "@/components/context/files-context";
import { useConversations } from "@/components/context/conversations-context";

// Panel content types
type PanelContentType = "Conversations" | "Chat" | "Tools" | "Files" | "Viewer";

// Panel selector component
function PanelSelector({ 
  currentType, 
  onChange,
  allowedTypes = ["Conversations", "Chat", "Tools", "Files", "Viewer"]
}: { 
  currentType: PanelContentType; 
  onChange: (type: PanelContentType) => void;
  allowedTypes?: PanelContentType[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Files context for file operations
  const filesContext = useFiles();
  const conversationsContext = useConversations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for panel type
  const getPanelIcon = (type: PanelContentType) => {
    switch (type) {
      case "Conversations":
        return <MessageCircle size={16} className="text-purple-500" />;
      case "Chat":
        return <MessageSquare size={16} className="text-blue-500" />;
      case "Tools":
        return <Wrench size={16} className="text-orange-500" />;
      case "Files":
        return <FolderOpen size={16} className="text-amber-500" />;
      case "Viewer":
        return <FileText size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  // Render panel-specific toolbar based on currentType
  const renderToolbar = () => {
    // Remove all left-aligned icons for a cleaner interface
    return null;
  };

  // Separate function for actions on the right side
  const renderPanelActions = () => {
    switch (currentType) {
      case "Conversations":
        return (
          <div className="flex items-center space-x-1">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
              onClick={() => conversationsContext.onNewConversation()}
              title="New Conversation"
            >
              <PlusCircle size={16} />
            </button>
          </div>
        );
      case "Chat":
        return null;
      case "Tools":
        return null;
      case "Files":
        return (
          <div className="flex items-center space-x-1">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
            >
              <Upload size={16} />
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
              onClick={() => {
                const folderName = prompt("Enter folder name:");
                if (folderName && folderName.trim() !== "") {
                  filesContext.createFolder(folderName);
                }
              }}
              title="New Folder"
            >
              <FolderPlus size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={(e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                // Upload each file
                for (let i = 0; i < files.length; i++) {
                  filesContext.uploadFile(files[i]);
                }
                
                // Reset the file input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              multiple
              accept=".txt,.js,.jsx,.ts,.tsx,.css,.html,.json,.md,.pdf,.doc,.docx"
            />
          </div>
        );
      case "Viewer":
        return (
          <div className="flex items-center space-x-1">
            {filesContext.activeTabId && (
              <>
                <button 
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
                  onClick={() => {
                    // Toggle edit mode
                    const win = window as any;
                    if (win._editorToggleEditMode && typeof win._editorToggleEditMode === 'function') {
                      win._editorToggleEditMode();
                    }
                  }}
                  title="Edit File"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
                  onClick={() => {
                    // Save file
                    const win = window as any;
                    if (win._editorSaveFile && typeof win._editorSaveFile === 'function') {
                      win._editorSaveFile();
                    }
                  }}
                  title="Save File"
                >
                  <Save size={16} />
                </button>
              </>
            )}
            <button 
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700 flex items-center"
              onClick={() => {
                // Download file
                const win = window as any;
                if (win._editorDownloadFile && typeof win._editorDownloadFile === 'function') {
                  win._editorDownloadFile();
                } else {
                  console.log("Download file clicked");
                }
              }}
              title="Download File"
            >
              <Download size={16} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex items-center gap-2 text-lg font-medium px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 shadow-sm"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {getPanelIcon(currentType)}
            <span>{currentType}</span>
            <ChevronDown 
              size={16} 
              className={`ml-1 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isOpen && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded-lg z-10 w-auto min-w-[160px] border border-gray-200 shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-150 p-2 flex flex-col gap-1"
              role="menu"
              aria-orientation="vertical"
            >
              {allowedTypes.map((type) => (
                <button
                  key={type}
                  className={`flex items-center w-full text-left px-3 py-2 text-sm transition-colors duration-150 rounded-md ${
                    type === currentType 
                      ? "font-medium bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onChange(type);
                    setIsOpen(false);
                  }}
                  role="menuitem"
                >
                  <span className="mr-2.5">{getPanelIcon(type)}</span>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Toolbar beside dropdown */}
        {renderToolbar()}
      </div>
      
      {/* Panel-specific actions on the right */}
      {renderPanelActions()}
    </div>
  );
}

export default function Main() {
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(20);
  const [centerPanelWidth, setCenterPanelWidth] = useState(60);
  const [rightPanelWidth, setRightPanelWidth] = useState(20);
  
  // Panel content type state
  const [leftPanelType, setLeftPanelType] = useState<PanelContentType>("Conversations");
  const [centerPanelType, setCenterPanelType] = useState<PanelContentType>("Chat");
  const [rightPanelType, setRightPanelType] = useState<PanelContentType>("Viewer");

  // Panel content renderer
  const renderPanelContent = (type: PanelContentType) => {
    switch (type) {
      case "Conversations":
        return <ConversationSidebar />;
      case "Chat":
        return <Assistant />;
      case "Tools":
        return <ToolsPanel />;
      case "Files":
        return <FilesPanel />;
      case "Viewer":
        return <Viewer />;
    }
  };

  // Initial dummy values - will be updated in useEffect
  const [windowSize, setWindowSize] = useState({
    width: 1200,
    height: 800
  });

  const [isClient, setIsClient] = useState(false);

  // Handle only window resize events - with empty dependency array
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      // Update window dimensions only
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - only runs once

  // Separate effect for panel width adjustments when window size changes
  useEffect(() => {
    if (!isClient) return;
    
    // Adjust panel widths proportionally when needed
    const totalWidth = leftPanelWidth + centerPanelWidth + rightPanelWidth;
    if (totalWidth !== 100) {
      const scaleFactor = 100 / totalWidth;
      setLeftPanelWidth(Math.round(leftPanelWidth * scaleFactor));
      setCenterPanelWidth(Math.round(centerPanelWidth * scaleFactor));
      setRightPanelWidth(100 - leftPanelWidth - centerPanelWidth);
    }
  }, [isClient, windowSize, leftPanelWidth, centerPanelWidth, rightPanelWidth]);

  // Calculate available height considering padding
  const availableHeight = windowSize.height - 32; // Account for padding

  const handleLeftPanelResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newWidth = Math.round((data.size.width / windowSize.width) * 100);
    setLeftPanelWidth(newWidth);
    setCenterPanelWidth(100 - newWidth - rightPanelWidth);
  };

  const handleCenterPanelResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newWidth = Math.round((data.size.width / windowSize.width) * 100);
    setCenterPanelWidth(newWidth);
    setRightPanelWidth(100 - leftPanelWidth - newWidth);
  };

  return (
    <div className="flex h-screen p-4 gap-4 bg-gray-100">
      {isClient && (
        <div className="flex gap-4 h-full w-full">
          {/* Left Panel */}
          <ResizablePanel
            width={windowSize.width * (leftPanelWidth / 100)}
            height={availableHeight}
            minConstraints={[200, availableHeight]}
            maxConstraints={[windowSize.width * 0.3, availableHeight]}
            onResize={handleLeftPanelResize}
            className="flex-none"
          >
            <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-stone-100">
                <PanelSelector 
                  currentType={leftPanelType} 
                  onChange={setLeftPanelType}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                {renderPanelContent(leftPanelType)}
              </div>
            </div>
          </ResizablePanel>

          {/* Center Panel */}
          <ResizablePanel
            width={windowSize.width * (centerPanelWidth / 100)}
            height={availableHeight}
            minConstraints={[400, availableHeight]}
            maxConstraints={[windowSize.width * 0.7, availableHeight]}
            onResize={handleCenterPanelResize}
            className="flex-1"
          >
            <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-stone-100">
                <PanelSelector 
                  currentType={centerPanelType} 
                  onChange={setCenterPanelType}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                {renderPanelContent(centerPanelType)}
              </div>
            </div>
          </ResizablePanel>

          {/* Right Panel */}
          <div className="hidden md:block" style={{ width: `${rightPanelWidth}%`, height: `${availableHeight}px` }}>
            <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-stone-100">
                <PanelSelector 
                  currentType={rightPanelType} 
                  onChange={setRightPanelType}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                {renderPanelContent(rightPanelType)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu button */}
      <div className="absolute top-4 right-4 md:hidden">
        <button onClick={() => setIsToolsPanelOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile tools panel overlay */}
      {isToolsPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30 md:hidden">
          <div className="w-full max-w-sm bg-white h-full rounded-l-2xl">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <PanelSelector 
                currentType={rightPanelType} 
                onChange={setRightPanelType}
              />
              <button onClick={() => setIsToolsPanelOpen(false)} className="ml-2">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderPanelContent(rightPanelType)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
