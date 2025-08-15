'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

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

  // Color mode values
  const resizeHandleBg = useColorModeValue('gray.200', 'gray.600');
  const resizeHandleHoverBg = useColorModeValue('blue.300', 'blue.400');
  const resizeHandleActiveBg = useColorModeValue('blue.400', 'blue.500');
  const resizeHandleIndicatorBg = useColorModeValue('gray.400', 'gray.500');

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
    <Box
      ref={containerRef}
      position="relative"
      w="full"
      h="full"
      display="flex"
      flexDirection={direction === 'vertical' ? 'column' : 'row'}
    >
      <Box
        position="relative"
        overflow="hidden"
        style={{
          [direction === 'vertical' ? 'height' : 'width']: `${splitPosition}%`,
        }}
      >
        {firstComponent}
      </Box>

      {/* Resizer handle */}
      <Box
        bg={resizeHandleBg}
        transition="colors"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={10}
        _hover={{ bg: resizeHandleHoverBg }}
        _active={{ bg: resizeHandleActiveBg }}
        onMouseDown={handleResizeStart}
        cursor={direction === 'vertical' ? 'ns-resize' : 'ew-resize'}
        {...(direction === 'vertical'
          ? {
              w: 'full',
              h: 2,
            }
          : {
              h: 'full',
              w: 2,
            }
        )}
      >
        {direction === 'vertical' ? (
          <Box w={8} h={1} bg={resizeHandleIndicatorBg} borderRadius="md" />
        ) : (
          <Box h={8} w={1} bg={resizeHandleIndicatorBg} borderRadius="md" />
        )}
      </Box>

      <Box
        position="relative"
        overflow="hidden"
        style={{
          [direction === 'vertical' ? 'height' : 'width']: `${100 - splitPosition}%`,
        }}
      >
        {secondComponent}
      </Box>
    </Box>
  );
}
