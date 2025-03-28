"use client";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ResizeCallbackData } from "react-resizable";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import ConversationSidebar from "@/components/conversation-sidebar";
import ResizablePanel from "@/components/resizable-panel";
import FilesPanel from "@/components/files-panel";

// Panel content types
type PanelContentType = "Conversations" | "Chat" | "Tools" | "Files";

// Panel selector component
function PanelSelector({ 
  currentType, 
  onChange,
  allowedTypes = ["Conversations", "Chat", "Tools", "Files"]
}: { 
  currentType: PanelContentType; 
  onChange: (type: PanelContentType) => void;
  allowedTypes?: PanelContentType[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 text-lg font-medium hover:opacity-80"
      >
        {currentType}
        <ChevronDown size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white shadow-md rounded-md z-10 min-w-32">
          {allowedTypes.map((type) => (
            <button
              key={type}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                type === currentType ? "font-medium" : ""
              }`}
              onClick={() => {
                onChange(type);
                setIsOpen(false);
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}
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
  const [rightPanelType, setRightPanelType] = useState<PanelContentType>("Tools");

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
