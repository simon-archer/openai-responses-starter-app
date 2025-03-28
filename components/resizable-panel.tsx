"use client";
import React, { useState, useEffect } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ResizablePanelProps {
  children: React.ReactNode;
  width: number;
  height: number;
  minConstraints?: [number, number];
  maxConstraints?: [number, number];
  resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
  axis?: 'x' | 'y' | 'both';
  className?: string;
  onResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
}

export default function ResizablePanel({
  children,
  width,
  height,
  minConstraints = [100, 100],
  maxConstraints = [Infinity, Infinity],
  resizeHandles = ['e'],
  axis = 'x',
  className = '',
  onResize,
}: ResizablePanelProps) {
  const [size, setSize] = useState({ width, height });

  // Update size when props change (e.g., when window is resized)
  useEffect(() => {
    setSize({ width, height });
  }, [width, height]);

  const handleResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const { size } = data;
    setSize({ width: size.width, height: size.height });
    if (onResize) {
      onResize(e, data);
    }
  };

  return (
    <ResizableBox
      width={size.width}
      height={size.height}
      minConstraints={minConstraints}
      maxConstraints={maxConstraints}
      resizeHandles={resizeHandles}
      axis={axis}
      onResize={handleResize}
      className={`overflow-hidden h-full ${className}`}
      handle={
        <div className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center">
          <div className="h-16 w-1 bg-gray-200 rounded-full hover:bg-gray-400 transition-colors"/>
        </div>
      }
    >
      <div className="h-full w-full rounded-lg overflow-hidden" suppressHydrationWarning>
        {children}
      </div>
    </ResizableBox>
  );
}