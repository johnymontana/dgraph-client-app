'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Separator,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'connection' | 'schema' | 'guides' | 'query';
  onSectionChange: (section: 'connection' | 'schema' | 'guides' | 'query') => void;
}

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string;
  children?: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  badge,
  children
}) => {
  return (
    <Box>
      <Button
        variant="ghost"
        onClick={onClick}
        size="sm"
        h="40px"
        px={3}
        w="full"
        justifyContent="start"
        bg={isActive ? "blue.500" : "transparent"}
        color={isActive ? "white" : "fg.secondary"}
        _hover={{ 
          bg: isActive ? "blue.600" : "bg.tertiary",
          color: isActive ? "white" : "fg.primary"
        }}
        _active={{ 
          bg: isActive ? "blue.600" : "bg.tertiary"
        }}
      >
        <HStack gap={3} w="full">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d={icon} />
          </svg>
          <Text fontSize="sm" fontWeight="medium" flex={1} textAlign="left">
            {label}
          </Text>
          {badge && (
            <Badge
              variant="solid"
              colorPalette={isActive ? "white" : "gray"}
              size="sm"
              borderRadius="full"
            >
              {badge}
            </Badge>
          )}
        </HStack>
      </Button>
      {children && (
        <Box ml={6} mt={2}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default function Sidebar({ isOpen, onToggle, activeSection, onSectionChange }: SidebarProps) {
  const { connected, endpoint } = useDgraph();

  const getConnectionStatus = () => {
    if (!endpoint) return { status: 'disconnected', label: 'Not Configured' };
    if (connected) return { status: 'connected', label: 'Connected' };
    return { status: 'disconnected', label: 'Disconnected' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w={isOpen ? "280px" : "60px"}
      layerStyle="sidebar"
      transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={40}
      overflow="hidden"
    >
      {/* Header */}
      <Box
        layerStyle="toolbar"
        px={isOpen ? 4 : 2}
        py={3}
        position="relative"
      >
        <HStack justify="space-between" align="center">
          {isOpen && (
            <Text fontSize="lg" fontWeight="bold" color="fg.primary">
              DGraph Client
            </Text>
          )}
          <IconButton
            aria-label="Toggle sidebar"
            variant="ghost"
            size="sm"
            onClick={onToggle}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path
                d={isOpen ? "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" : "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"}
              />
            </svg>
          </IconButton>
        </HStack>
      </Box>

      {/* Connection Status */}
      <Box px={isOpen ? 4 : 2} py={3}>
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
      <Box px={isOpen ? 4 : 2} py={4} flex={1} overflowY="auto">
        <VStack gap={2} align="stretch">
          <SidebarItem
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            label="Connection"
            isActive={activeSection === 'connection'}
            onClick={() => onSectionChange('connection')}
            badge={isOpen ? undefined : "C"}
          />
          <SidebarItem
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            label="Schema"
            isActive={activeSection === 'schema'}
            onClick={() => onSectionChange('schema')}
            badge={isOpen ? undefined : "S"}
          />
          <SidebarItem
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            label="Guides"
            isActive={activeSection === 'guides'}
            onClick={() => onSectionChange('guides')}
            badge={isOpen ? undefined : "G"}
          />
          <SidebarItem
            icon="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            label="Query"
            isActive={activeSection === 'query'}
            onClick={() => onSectionChange('query')}
            badge={isOpen ? undefined : "Q"}
          />
        </VStack>
      </Box>

      {/* Footer */}
      <Box px={isOpen ? 4 : 2} py={3} borderTop="1px" borderColor="border.primary">
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
