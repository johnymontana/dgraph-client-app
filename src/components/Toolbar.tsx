'use client';

import React from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { useDgraph } from '@/context/DgraphContext';
import StatusIndicator from './StatusIndicator';

interface ToolbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Toolbar({ isSidebarOpen, onToggleSidebar }: ToolbarProps) {
  const { isLight, toggleColorMode } = useColorMode();
  const { connected, disconnect } = useDgraph();

  const handleDisconnect = () => {
    if (connected) {
      disconnect();
    }
  };

  return (
    <Box
      as="header"
      layerStyle="toolbar"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={30}
    >
      <Container maxW="7xl" py={3} px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex justify="space-between" align="center">
          {/* Left Section */}
          <HStack gap={4}>
            <IconButton
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              variant="ghost"
              size="sm"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </IconButton>
            
            <VStack align="start" gap={0}>
              <Heading as="h1" size="lg" color="fg.primary">
                DGraph Client
              </Heading>
              <Text fontSize="xs" color="fg.tertiary">
                Graph Database Explorer
              </Text>
            </VStack>
            
            <Badge
              variant="solid"
              colorPalette="blue"
              size="sm"
              borderRadius="full"
              px={2}
              py={1}
            >
              DQL Explorer
            </Badge>
          </HStack>

          {/* Center Section - Connection Status */}
          <Box textAlign="center">
            <StatusIndicator />
          </Box>

          {/* Right Section */}
          <HStack gap={3}>
            {/* Theme Toggle */}
            <IconButton
              onClick={toggleColorMode}
              aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
              variant="ghost"
              size="sm"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                {isLight ? (
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                ) : (
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                )}
              </svg>
            </IconButton>

            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              color="fg.secondary"
              _hover={{ color: "fg.primary" }}
              title="Documentation and Help"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Help
            </Button>

            {/* Connection Actions */}
            {connected && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                colorPalette="red"
                size="sm"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
