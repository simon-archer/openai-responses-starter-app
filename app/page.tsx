"use client";
import { Menu, X, ChevronDown, Upload, FolderPlus, Save, MessageCircle, MessageSquare, Wrench, FolderOpen, FileText, PlusCircle, Download, Edit, ChevronRight, ChevronLeft, Plus, Square } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ResizeCallbackData } from "react-resizable";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import ConversationSidebar from "@/components/conversation-sidebar";
import ResizablePanel from "@/components/resizable-panel";
import FilesPanel from "@/components/files-panel";
import Viewer from "@/components/editor";
import { useFiles } from "@/components/context/files-context";
import { useConversations } from "@/components/context/conversations-context";

// Panel content types
type PanelContentType = "Conversations" | "Chat" | "Tools" | "Files" | "Viewer";

// Panel selector component
function PanelSelector({ 
  currentType, 
  onChange,
  onClose,
  onAddPanel,
  allowedTypes = ["Conversations", "Chat", "Tools", "Files", "Viewer"]
}: { 
  currentType: PanelContentType; 
  onChange: (type: PanelContentType) => void;
  onClose?: () => void;
  onAddPanel?: () => void;
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
      <div className="flex items-center gap-2">
        {/* Panel management buttons */}
        <div className="flex items-center gap-1">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
              title="Close panel"
            >
              <X size={14} />
            </button>
          )}
          {/* Add panel button */}
          {onAddPanel && (
            <button 
              onClick={onAddPanel}
              className="p-1 rounded hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors"
              title="Add panel"
            >
              <Square size={14} />
            </button>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 shadow-sm"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {getPanelIcon(currentType)}
            <span>{currentType}</span>
            <ChevronDown 
              size={14} 
              className={`opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isOpen && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded-lg z-10 w-auto min-w-[140px] border border-gray-200 shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-150 p-1 flex flex-col gap-0.5"
              role="menu"
              aria-orientation="vertical"
            >
              {allowedTypes.map((type) => (
                <button
                  key={type}
                  className={`flex items-center w-full text-left px-2 py-1.5 text-xs transition-colors duration-150 rounded-md ${
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
                  <span className="mr-2">{getPanelIcon(type)}</span>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Toolbar beside dropdown */}
        {renderToolbar()}
      </div>
      
      <div className="flex items-center gap-1">
        {/* Panel-specific actions */}
        {renderPanelActions()}
      </div>
    </div>
  );
}

export default function Main() {
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(20);
  const [centerPanelWidth, setCenterPanelWidth] = useState(60);
  const [rightPanelWidth, setRightPanelWidth] = useState(20);
  
  // Panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [centerPanelVisible, setCenterPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Available panel types for adding new panels
  const [availablePanelTypes, setAvailablePanelTypes] = useState<PanelContentType[]>(["Conversations", "Chat", "Tools", "Files", "Viewer"]);

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

  // Separate effect for panel width adjustments when window size changes OR visibility/widths change
  useEffect(() => {
    if (!isClient) return;

    const visiblePanelsBools = [leftPanelVisible, centerPanelVisible, rightPanelVisible];
    const visibleCount = visiblePanelsBools.filter(Boolean).length;

    // Calculate the total width ONLY of currently visible panels based on their current state
    const currentTotalWidthOfVisible =
      (leftPanelVisible ? leftPanelWidth : 0) +
      (centerPanelVisible ? centerPanelWidth : 0) +
      (rightPanelVisible ? rightPanelWidth : 0);

    if (visibleCount === 1) {
      // If exactly one panel should be visible, force its width to 100%
      // and ensure the others are 0%. Check current state to avoid unnecessary updates.
      if (leftPanelVisible && leftPanelWidth !== 100) setLeftPanelWidth(100);
      if (centerPanelVisible && centerPanelWidth !== 100) setCenterPanelWidth(100);
      if (rightPanelVisible && rightPanelWidth !== 100) setRightPanelWidth(100);

      // Explicitly set non-visible panels' width state to 0
      if (!leftPanelVisible && leftPanelWidth !== 0) setLeftPanelWidth(0);
      if (!centerPanelVisible && centerPanelWidth !== 0) setCenterPanelWidth(0);
      if (!rightPanelVisible && rightPanelWidth !== 0) setRightPanelWidth(0);

    } else if (visibleCount > 1 && Math.abs(currentTotalWidthOfVisible - 100) > 0.1) {
      // If multiple panels are visible and their total width is off (e.g., after resize or close),
      // rescale ONLY the visible panels proportionally to fit 100%.
      const scaleFactor = 100 / currentTotalWidthOfVisible;
      if (leftPanelVisible) setLeftPanelWidth(leftPanelWidth * scaleFactor);
      if (centerPanelVisible) setCenterPanelWidth(centerPanelWidth * scaleFactor);
      if (rightPanelVisible) setRightPanelWidth(rightPanelWidth * scaleFactor);
    }
    // No need for an else (visibleCount === 0) because the close handlers should have set widths to 0.

  }, [
       isClient,
       windowSize, // Reacts to window resize
       leftPanelVisible, centerPanelVisible, rightPanelVisible, // Reacts to visibility changes
       leftPanelWidth, centerPanelWidth, rightPanelWidth // Reacts to width changes (important!)
     ]);

  // Calculate available height considering padding
  const availableHeight = windowSize.height - 32; // Account for padding

  const handleLeftPanelResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newWidth = Math.round((data.size.width / windowSize.width) * 100);
    
    if (centerPanelVisible && rightPanelVisible) {
      // Keep the ratio between center and right panels constant
      const remainingWidth = 100 - newWidth;
      const ratio = centerPanelWidth / (centerPanelWidth + rightPanelWidth);
      const newCenterWidth = Math.round(remainingWidth * ratio);
      
      setLeftPanelWidth(newWidth);
      setCenterPanelWidth(newCenterWidth);
      setRightPanelWidth(100 - newWidth - newCenterWidth);
    } else if (centerPanelVisible) {
      setLeftPanelWidth(newWidth);
      setCenterPanelWidth(100 - newWidth);
    } else if (rightPanelVisible) {
      setLeftPanelWidth(newWidth);
      setRightPanelWidth(100 - newWidth);
    }
  };

  const handleCenterPanelResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newWidth = Math.round((data.size.width / windowSize.width) * 100);
    
    if (leftPanelVisible && rightPanelVisible) {
      // When dragging center panel, adjust right panel to maintain 100% total
      setCenterPanelWidth(newWidth);
      setRightPanelWidth(100 - leftPanelWidth - newWidth);
    } else if (leftPanelVisible) {
      setCenterPanelWidth(newWidth);
      setLeftPanelWidth(100 - newWidth);
    } else if (rightPanelVisible) {
      setCenterPanelWidth(newWidth);
      setRightPanelWidth(100 - newWidth);
    }
  };

  // Handle panel close (These handlers primarily manage visibility and initial width redistribution)
  const handleCloseLeftPanel = () => {
    setLeftPanelVisible(false);
    // The useEffect above will handle the final width correction based on the new visibility state.
    // We still set the closed panel's width to 0 immediately.
    setLeftPanelWidth(0);

    // Optional: Give a hint to the remaining panels, but useEffect is the authority
    const remainingVisiblePanels = [false, centerPanelVisible, rightPanelVisible].filter(Boolean);
    if (remainingVisiblePanels.length === 2) {
        const totalRemainingWidth = centerPanelWidth + rightPanelWidth;
        if (totalRemainingWidth > 0) {
          const centerRatio = centerPanelWidth / totalRemainingWidth;
          // Set temporary proportional widths - useEffect will verify/correct
          setCenterPanelWidth(100 * centerRatio);
          setRightPanelWidth(100 * (1 - centerRatio));
        } else {
          setCenterPanelWidth(50); // Fallback
          setRightPanelWidth(50);
        }
    } else if (remainingVisiblePanels.length === 1) {
       // Let useEffect handle setting the single panel to 100%
    }
  };

  const handleCloseCenterPanel = () => {
    setCenterPanelVisible(false);
    setCenterPanelWidth(0);

    // Optional hint for remaining panels
    const remainingVisiblePanels = [leftPanelVisible, false, rightPanelVisible].filter(Boolean);
     if (remainingVisiblePanels.length === 2) {
        const totalRemainingWidth = leftPanelWidth + rightPanelWidth;
        if (totalRemainingWidth > 0) {
          const leftRatio = leftPanelWidth / totalRemainingWidth;
          setLeftPanelWidth(100 * leftRatio);
          setRightPanelWidth(100 * (1 - leftRatio));
        } else {
           setLeftPanelWidth(50);
           setRightPanelWidth(50);
        }
    } else if (remainingVisiblePanels.length === 1) {
       // Let useEffect handle setting the single panel to 100%
    }
  };

  const handleCloseRightPanel = () => {
    setRightPanelVisible(false);
    setRightPanelWidth(0);

    // Optional hint for remaining panels
    const remainingVisiblePanels = [leftPanelVisible, centerPanelVisible, false].filter(Boolean);
    if (remainingVisiblePanels.length === 2) {
        const totalRemainingWidth = leftPanelWidth + centerPanelWidth;
        if (totalRemainingWidth > 0) {
            const leftRatio = leftPanelWidth / totalRemainingWidth;
            setLeftPanelWidth(100 * leftRatio);
            setCenterPanelWidth(100 * (1 - leftRatio));
        } else {
            setLeftPanelWidth(50);
            setCenterPanelWidth(50);
        }
    } else if (remainingVisiblePanels.length === 1) {
        // Let useEffect handle setting the single panel to 100%
    }
  };

  // State for panel type selector
  const [selectingPanelType, setSelectingPanelType] = useState(false);
  
  // Simple approach: add a new panel to the right of all existing panels
  const handleAddPanel = () => {
    // If right panel is not visible, show it
    if (!rightPanelVisible) {
      setRightPanelVisible(true);
      setRightPanelType("Files");
      
      // Calculate new widths
      if (leftPanelVisible && centerPanelVisible) {
        // All three panels will be visible, distribute proportionally
        const totalCurrentWidth = leftPanelWidth + centerPanelWidth;
        const scaleFactor = 80 / totalCurrentWidth; // Reserve 20% for right panel
        setLeftPanelWidth(Math.round(leftPanelWidth * scaleFactor));
        setCenterPanelWidth(Math.round(centerPanelWidth * scaleFactor));
        setRightPanelWidth(20);
      } else if (leftPanelVisible) {
        // Only left panel is visible, give 70/30 split
        setLeftPanelWidth(70);
        setRightPanelWidth(30);
      } else if (centerPanelVisible) {
        // Only center panel is visible, give 70/30 split
        setCenterPanelWidth(70);
        setRightPanelWidth(30);
      }
      return;
    }
    
    // If center panel is not visible, show it
    if (!centerPanelVisible) {
      setCenterPanelVisible(true);
      setCenterPanelType("Chat");
      
      // Calculate new widths
      if (leftPanelVisible && rightPanelVisible) {
        // All three panels will be visible, distribute proportionally
        const totalCurrentWidth = leftPanelWidth + rightPanelWidth;
        const scaleFactor = 80 / totalCurrentWidth; // Reserve 20% for center panel
        setLeftPanelWidth(Math.round(leftPanelWidth * scaleFactor));
        setRightPanelWidth(Math.round(rightPanelWidth * scaleFactor));
        setCenterPanelWidth(20);
      } else if (leftPanelVisible) {
        // Only left panel is visible, give 70/30 split
        setLeftPanelWidth(70);
        setCenterPanelWidth(30);
      } else if (rightPanelVisible) {
        // Only right panel is visible, give 70/30 split
        setCenterPanelWidth(30);
        setRightPanelWidth(70);
      }
      return;
    }
    
    // If left panel is not visible, show it
    if (!leftPanelVisible) {
      setLeftPanelVisible(true);
      setLeftPanelType("Conversations");
      
      // Calculate new widths
      if (centerPanelVisible && rightPanelVisible) {
        // All three panels will be visible, distribute proportionally
        const totalCurrentWidth = centerPanelWidth + rightPanelWidth;
        const scaleFactor = 80 / totalCurrentWidth; // Reserve 20% for left panel
        setCenterPanelWidth(Math.round(centerPanelWidth * scaleFactor));
        setRightPanelWidth(Math.round(rightPanelWidth * scaleFactor));
        setLeftPanelWidth(20);
      } else if (centerPanelVisible) {
        // Only center panel is visible, give 70/30 split
        setLeftPanelWidth(30);
        setCenterPanelWidth(70);
      } else if (rightPanelVisible) {
        // Only right panel is visible, give 70/30 split
        setLeftPanelWidth(30);
        setRightPanelWidth(70);
      }
      return;
    }
    
    // If all panels are already visible, show a message or do nothing
    console.log("All panels are already visible");
  };

  // Show options to add a new panel if none are visible
  const handleEmptyStateAddPanel = () => {
    // Start with the center panel at full width
    setLeftPanelVisible(false);
    setCenterPanelVisible(true);
    setRightPanelVisible(false);
    setLeftPanelWidth(0);
    setCenterPanelWidth(100);
    setRightPanelWidth(0);
    setCenterPanelType("Chat"); // Or a default type you prefer
  };

  const getVisibleCount = () => {
    return [leftPanelVisible, centerPanelVisible, rightPanelVisible].filter(Boolean).length;
  };

  return (
    <div className="flex h-screen p-4 bg-gray-100 relative">
      {isClient && (
        <div className={`flex ${getVisibleCount() > 1 ? 'gap-4' : ''} h-full w-full`}>
          {/* For the single panel case, render a non-resizable full-width container instead */}
          {getVisibleCount() === 1 ? (
            <>
              {leftPanelVisible && (
                <div className="h-full w-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                    <PanelSelector 
                      currentType={leftPanelType} 
                      onChange={setLeftPanelType}
                      onClose={handleCloseLeftPanel}
                      onAddPanel={handleAddPanel}
                    />
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    {renderPanelContent(leftPanelType)}
                  </div>
                </div>
              )}
              
              {centerPanelVisible && (
                <div className="h-full w-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                    <PanelSelector 
                      currentType={centerPanelType} 
                      onChange={setCenterPanelType}
                      onClose={handleCloseCenterPanel}
                      onAddPanel={handleAddPanel}
                    />
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    {renderPanelContent(centerPanelType)}
                  </div>
                </div>
              )}
              
              {rightPanelVisible && (
                <div className="h-full w-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                    <PanelSelector 
                      currentType={rightPanelType} 
                      onChange={setRightPanelType}
                      onClose={handleCloseRightPanel}
                      onAddPanel={handleAddPanel}
                    />
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    {renderPanelContent(rightPanelType)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Original multi-panel resizable layout */}
              {leftPanelVisible && (
                <ResizablePanel
                  width={windowSize.width * (leftPanelWidth / 100)}
                  height={availableHeight}
                  minConstraints={[240, availableHeight]}
                  maxConstraints={[windowSize.width * (centerPanelVisible && rightPanelVisible ? 0.4 : 0.95), availableHeight]}
                  onResize={handleLeftPanelResize}
                  className="flex-none"
                >
                  <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                      <PanelSelector 
                        currentType={leftPanelType} 
                        onChange={setLeftPanelType}
                        onClose={handleCloseLeftPanel}
                        onAddPanel={handleAddPanel}
                      />
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {renderPanelContent(leftPanelType)}
                    </div>
                  </div>
                </ResizablePanel>
              )}

              {/* Center Panel */}
              {centerPanelVisible && (
                <ResizablePanel
                  width={windowSize.width * (centerPanelWidth / 100)}
                  height={availableHeight}
                  minConstraints={[480, availableHeight]}
                  maxConstraints={[windowSize.width * (leftPanelVisible && rightPanelVisible ? 0.8 : 0.95), availableHeight]}
                  onResize={handleCenterPanelResize}
                  className="flex-1"
                >
                  <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                      <PanelSelector 
                        currentType={centerPanelType} 
                        onChange={setCenterPanelType}
                        onClose={handleCloseCenterPanel}
                        onAddPanel={handleAddPanel}
                      />
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {renderPanelContent(centerPanelType)}
                    </div>
                  </div>
                </ResizablePanel>
              )}

              {/* Right Panel */}
              {rightPanelVisible && (
                <ResizablePanel
                  width={windowSize.width * (rightPanelWidth / 100)}
                  height={availableHeight}
                  minConstraints={[280, availableHeight]}
                  maxConstraints={[windowSize.width * (leftPanelVisible && centerPanelVisible ? 0.4 : 0.95), availableHeight]}
                  onResize={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
                    const newWidth = Math.round((data.size.width / windowSize.width) * 100);
                    
                    if (leftPanelVisible && centerPanelVisible) {
                      // Keep the ratio between left and center panels constant
                      const remainingWidth = 100 - newWidth;
                      const ratio = leftPanelWidth / (leftPanelWidth + centerPanelWidth);
                      const newLeftWidth = Math.round(remainingWidth * ratio);
                      
                      setRightPanelWidth(newWidth);
                      setLeftPanelWidth(newLeftWidth);
                      setCenterPanelWidth(100 - newWidth - newLeftWidth);
                    } else if (centerPanelVisible) {
                      setRightPanelWidth(newWidth);
                      setCenterPanelWidth(100 - newWidth);
                    } else if (leftPanelVisible) {
                      setRightPanelWidth(newWidth);
                      setLeftPanelWidth(100 - newWidth);
                    } else {
                      setRightPanelWidth(100);
                    }
                  }}
                  className="flex-none"
                >
                  <div className="h-full rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-none flex justify-between items-center px-3 py-2 border-b border-stone-100">
                      <PanelSelector 
                        currentType={rightPanelType} 
                        onChange={setRightPanelType}
                        onClose={handleCloseRightPanel}
                        onAddPanel={handleAddPanel}
                      />
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {renderPanelContent(rightPanelType)}
                    </div>
                  </div>
                </ResizablePanel>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state - when no panels are visible */}
      {isClient && !leftPanelVisible && !centerPanelVisible && !rightPanelVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleEmptyStateAddPanel}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-2 text-sm transition-colors shadow-sm border border-gray-200"
          >
            <Plus size={16} />
            <span>Add Panel</span>
          </button>
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
