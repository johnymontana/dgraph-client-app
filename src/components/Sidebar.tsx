'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Separator,
  Badge,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'connection' | 'schema' | 'guides' | 'query';
  onSectionChange: (section: 'connection' | 'schema' | 'guides' | 'query') => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string;
  children?: React.ReactNode;
  isMobile?: boolean;
  isOpen: boolean;
}

function SidebarItem({
  icon,
  label,
  isActive,
  onClick,
  badge,
  children,
  isMobile,
  isOpen
}: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      size={{ base: "lg", md: "md" }}
      w="full"
      justifyContent="flex-start"
      px={{ base: 4, md: 4 }}
      py={{ base: 3, md: 2 }}
      h={{ base: "auto", md: "auto" }}
      minH={{ base: "48px", md: "40px" }}
      bg={isActive ? "accent.primary" : "transparent"}
      color={isActive ? "white" : "fg.primary"}
      _hover={{
        bg: isActive ? "accent.primary" : "bg.tertiary",
        color: isActive ? "white" : "fg.primary"
      }}
      _active={{
        bg: isActive ? "accent.primary" : "bg.tertiary",
        color: isActive ? "white" : "fg.primary"
      }}
      onClick={onClick}
      position="relative"
      borderRadius="md"
      transition="all 0.2s"
    >
      <HStack gap={3} align="center" w="full" justify="flex-start">
        <Box
          w={{ base: "20px", md: "16px" }}
          h={{ base: "20px", md: "16px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
            <path d={icon} />
          </svg>
        </Box>
        
        <Text
          fontSize={{ base: "md", md: "sm" }}
          fontWeight="medium"
          flex={1}
          textAlign="left"
          display={isOpen ? "block" : "none"}
        >
          {label}
        </Text>
        
        {badge && (
          <Badge
            variant="solid"
            colorPalette="blue"
            size="sm"
            borderRadius="full"
            position="absolute"
            top={2}
            right={2}
            fontSize="xs"
            px={1}
            py={0.5}
          >
            {badge}
          </Badge>
        )}
      </HStack>
      
      {children}
    </Button>
  );
}

export default function Sidebar({ isOpen, activeSection, onSectionChange, isMobile, isTablet }: SidebarProps) {
  const { connected, endpoint } = useDgraph();
  const [mounted, setMounted] = useState(false);

  // Ensure consistent client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const getConnectionStatus = () => {
    if (connected) {
      return { status: 'connected', label: 'Connected' };
    }
    if (endpoint && endpoint !== 'http://localhost:8080') {
      return { status: 'loading', label: 'Configured' };
    }
    return { status: 'disconnected', label: 'Disconnected' };
  };

  const connectionStatus = getConnectionStatus();

  // Responsive sidebar behavior
  const sidebarWidth = isMobile ? "100vw" : isTablet ? "320px" : "280px";
  const transformValue = isOpen ? "translateX(0)" : isMobile ? "translateX(-100%)" : `translateX(-${sidebarWidth})`;
  
  console.log('Sidebar state:', { isOpen, isMobile, isTablet, sidebarWidth, transformValue });

  // Don't render connection status until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Box
        position="fixed"
        left={0}
        top={0}
        h="100vh"
        w={sidebarWidth}
        layerStyle="sidebar"
        transform={transformValue}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={40}
        overflow="hidden"
      >
        {/* Header */}
        <Box
          layerStyle="toolbar"
          px={{ base: 4, md: isOpen ? 4 : 2 }}
          py={3}
          position="relative"
        >
          <HStack justify="space-between" align="center">
            {isOpen && (
              <Text fontSize={{ base: "lg", md: "lg" }} fontWeight="bold" color="fg.primary">
                DGraph Client
              </Text>
            )}
            {!isOpen && !isMobile && (
              <Text fontSize="lg" fontWeight="bold" color="fg.primary" textAlign="center" w="full">
                DG
              </Text>
            )}
          </HStack>
        </Box>

        {/* Placeholder for connection status */}
        <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={3}>
          <Box
            layerStyle="status-badge"
            bg="status.disconnected"
            color="white"
            textAlign={isOpen ? "left" : "center"}
          >
            {isOpen ? "Loading..." : "L"}
          </Box>
        </Box>

        <Separator />

        {/* Navigation Items */}
        <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={4} flex={1} overflowY="auto">
          <VStack gap={{ base: 3, md: 2 }} align="stretch">
            <SidebarItem
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              label="Connection"
              isActive={activeSection === 'connection'}
              onClick={() => onSectionChange('connection')}
              badge={isOpen ? undefined : "C"}
              isMobile={isMobile}
              isOpen={isOpen}
            />
            <SidebarItem
              icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              label="Schema"
              isActive={activeSection === 'schema'}
              onClick={() => onSectionChange('schema')}
              badge={isOpen ? undefined : "S"}
              isMobile={isMobile}
              isOpen={isOpen}
            />
            <SidebarItem
              icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              label="Guides"
              isActive={activeSection === 'guides'}
              onClick={() => onSectionChange('guides')}
              badge={isOpen ? undefined : "G"}
              isMobile={isMobile}
              isOpen={isOpen}
            />
            <SidebarItem
              icon="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              label="Query"
              isActive={activeSection === 'query'}
              onClick={() => onSectionChange('query')}
              badge={isOpen ? undefined : "Q"}
              isMobile={isMobile}
              isOpen={isOpen}
            />
          </VStack>
        </Box>

        {/* Footer */}
        <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={3} borderTop="1px" borderColor="border.primary">
          <Text
            fontSize="xs"
            color="fg.tertiary"
            textAlign={isOpen ? "left" : "center"}
          >
            {isOpen ? "DGraph Client v0.1.0" : "v0.1.0"}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w={sidebarWidth}
      layerStyle="sidebar"
      transform={transformValue}
      transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={40}
      overflow="hidden"
    >
      {/* Header */}
      <Box
        layerStyle="toolbar"
        px={{ base: 4, md: isOpen ? 4 : 2 }}
        py={3}
        position="relative"
      >
        <HStack justify="space-between" align="center">
          {isOpen && (
            <Text fontSize={{ base: "lg", md: "lg" }} fontWeight="bold" color="fg.primary">
              DGraph Client
            </Text>
          )}
          {!isOpen && !isMobile && (
            <Text fontSize="lg" fontWeight="bold" color="fg.primary" textAlign="center" w="full">
              DG
            </Text>
          )}
        </HStack>
      </Box>

      {/* Connection Status */}
      <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={3}>
        <Box
          layerStyle="status-badge"
          bg={`status.${connectionStatus.status}`}
          color="white"
          textAlign={isOpen ? "left" : "center"}
        >
          {isOpen ? connectionStatus.label : connectionStatus.label.charAt(0)}
        </Box>
      </Box>

      <Separator />

      {/* Navigation Items */}
      <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={4} flex={1} overflowY="auto">
        <VStack gap={{ base: 3, md: 2 }} align="stretch">
          <SidebarItem
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            label="Connection"
            isActive={activeSection === 'connection'}
            onClick={() => onSectionChange('connection')}
            badge={isOpen ? undefined : "C"}
            isMobile={isMobile}
            isOpen={isOpen}
          />
          <SidebarItem
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            label="Schema"
            isActive={activeSection === 'schema'}
            onClick={() => onSectionChange('schema')}
            badge={isOpen ? undefined : "S"}
            isMobile={isMobile}
            isOpen={isOpen}
          />
          <SidebarItem
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            label="Guides"
            isActive={activeSection === 'guides'}
            onClick={() => onSectionChange('guides')}
            badge={isOpen ? undefined : "G"}
            isMobile={isMobile}
            isOpen={isOpen}
          />
          <SidebarItem
            icon="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            label="Query"
            isActive={activeSection === 'query'}
            onClick={() => onSectionChange('query')}
            badge={isOpen ? undefined : "Q"}
            isMobile={isMobile}
            isOpen={isOpen}
          />
        </VStack>
      </Box>

      {/* Footer */}
      <Box px={{ base: 4, md: isOpen ? 4 : 2 }} py={3} borderTop="1px" borderColor="border.primary">
        <Text
          fontSize="xs"
          color="fg.tertiary"
          textAlign={isOpen ? "left" : "center"}
        >
          {isOpen ? "DGraph Client v0.1.0" : "v0.1.0"}
        </Text>
      </Box>
    </Box>
  );
}
