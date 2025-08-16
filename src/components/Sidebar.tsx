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
  activeSection: 'connection' | 'schema' | 'guides';
  onSectionChange: (section: 'connection' | 'schema' | 'guides') => void;
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
            icon="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            label="Connection"
            isActive={activeSection === 'connection'}
            onClick={() => onSectionChange('connection')}
            badge={isOpen ? undefined : "C"}
          />

          <SidebarItem
            icon="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zM7 6h10v13H7V6zm2 2v9h2V8H9zm4 0v9h2V8h-2z"
            label="Schema"
            isActive={activeSection === 'schema'}
            onClick={() => onSectionChange('schema')}
            badge={isOpen ? undefined : "S"}
          />

          <SidebarItem
            icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            label="Guides"
            isActive={activeSection === 'guides'}
            onClick={() => onSectionChange('guides')}
            badge={isOpen ? undefined : "G"}
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
