'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function Drawer({
  isOpen,
  onClose,
  children,
  initialWidth = 400,
  minWidth = 320,
  maxWidth = 600
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const resizeHandleColor = useColorModeValue('gray.300', 'gray.600');
  const resizeHandleHoverColor = useColorModeValue('blue.200', 'blue.600');

  // Close drawer when clicking outside of it (only if not resizing)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drawerRef.current &&
        isOpen &&
        !isResizing &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isResizing]);

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width based on mouse position
      const newWidth = e.clientX;

      // Apply constraints (min and max width)
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
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
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={30}
        opacity={isOpen ? 1 : 0}
        pointerEvents={isOpen ? 'auto' : 'none'}
        transition="opacity 0.3s ease-in-out"
        onClick={isResizing ? undefined : onClose}
      />

      {/* Drawer */}
      <Box
        ref={drawerRef}
        position="fixed"
        top={0}
        left={0}
        height="100vh"
        width={`${width}px`}
        bg={bgColor}
        shadow="2xl"
        borderRight="1px"
        borderColor={borderColor}
        transform={isOpen ? 'translateX(0)' : 'translateX(-100%)'}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={40}
        overflowY="auto"
        overflowX="hidden"
      >
        {/* Header */}
        <Box
          position="sticky"
          top={0}
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          px={6}
          py={4}
          zIndex={10}
        >
          <Box position="relative">
            <IconButton
              aria-label="Close drawer"
              variant="ghost"
              size="sm"
              position="absolute"
              top={-2}
              right={-2}
              onClick={onClose}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              _focus={{ ring: 2, ringColor: 'blue.500' }}
            >
              <Icon viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Icon>
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box px={6} py={4}>
          <VStack gap={6} align="stretch">
            {children}
          </VStack>
        </Box>

        {/* Resize handle */}
        <Box
          position="absolute"
          top={0}
          right={0}
          width="4px"
          height="100%"
          cursor="ew-resize"
          bg={resizeHandleColor}
          _hover={{ bg: resizeHandleHoverColor }}
          transition="background-color 0.2s"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
          zIndex={20}
        />
      </Box>
    </>
  );
}
