'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ResizableContainerProps {
  firstComponent: React.ReactNode;
  secondComponent: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  initialSplit?: number;
  minFirstSize?: number;
  minSecondSize?: number;
}

export default function ResizableContainer({
  firstComponent,
  secondComponent,
  direction = 'vertical',
  initialSplit = 50,
  minFirstSize = 10,
  minSecondSize = 10,
}: ResizableContainerProps) {
  const [splitPosition, setSplitPosition] = useState(initialSplit);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (direction === 'vertical') {
        const containerHeight = containerRect.height;
        const offsetY = e.clientY - containerRect.top;
        const percentage = (offsetY / containerHeight) * 100;

        // Apply constraints
        if (percentage >= minFirstSize && percentage <= (100 - minSecondSize)) {
          setSplitPosition(percentage);
        }
      } else {
        const containerWidth = containerRect.width;
        const offsetX = e.clientX - containerRect.left;
        const percentage = (offsetX / containerWidth) * 100;

        // Apply constraints
        if (percentage >= minFirstSize && percentage <= (100 - minSecondSize)) {
          setSplitPosition(percentage);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'vertical' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minFirstSize, minSecondSize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${direction === 'vertical' ? 'flex flex-col' : 'flex flex-row'}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          [direction === 'vertical' ? 'height' : 'width']: `${splitPosition}%`,
          overflow: 'hidden'
        }}
        className="relative"
      >
        {firstComponent}
      </div>

      {/* Resizer handle */}
      <div
        className={`
          ${direction === 'vertical'
            ? 'w-full h-2 cursor-ns-resize hover:bg-indigo-300 active:bg-indigo-400'
            : 'h-full w-2 cursor-ew-resize hover:bg-indigo-300 active:bg-indigo-400'
          }
          bg-gray-200 transition-colors flex items-center justify-center z-10
        `}
        onMouseDown={handleResizeStart}
      >
        {direction === 'vertical'
          ? (
            <div className="w-8 h-1 bg-gray-400 rounded"></div>
          ) : (
            <div className="h-8 w-1 bg-gray-400 rounded"></div>
          )
        }
      </div>

      <div
        style={{
          [direction === 'vertical' ? 'height' : 'width']: `${100 - splitPosition}%`,
          overflow: 'hidden'
        }}
        className="relative"
      >
        {secondComponent}
      </div>
    </div>
  );
}
