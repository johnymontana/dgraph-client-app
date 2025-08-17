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
import { Icons } from '@/components/ui/icons';
import StatusIndicator from './StatusIndicator';

interface ToolbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobile?: boolean;
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
      <Container maxW="full" py={3} px={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align="center" h="48px">
          {/* Left Section */}
          <HStack gap={4} flex={1}>
            <IconButton
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              variant="ghost"
              size="sm"
            >
              <Icons.menu size={18} />
            </IconButton>
            
            <VStack align="start" gap={0} flex={1} minW={0}>
              <Heading textStyle="heading.card">
                DGraph Client
              </Heading>
              <Text textStyle="body.small">
                Graph Database Explorer
              </Text>
            </VStack>
            
            <Badge
              variant="subtle"
              colorPalette="blue"
              size="sm"
              borderRadius="full"
              px={3}
              py={1}
              display={{ base: "none", lg: "inline-flex" }}
              bg="accent.subtle"
              color="accent.primary"
              border="1px solid"
              borderColor="border.accent"
            >
              DQL Explorer
            </Badge>
          </HStack>

          {/* Center Section - Connection Status */}
          <Box textAlign="center" flex="0 0 auto" mx={6}>
            <StatusIndicator />
          </Box>

          {/* Right Section */}
          <HStack gap={2} flex="0 0 auto">
            {/* Theme Toggle */}
            <IconButton
              onClick={toggleColorMode}
              aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
              variant="ghost"
              size="sm"
            >
              {isLight ? <Icons.moon size={16} /> : <Icons.sun size={16} />}
            </IconButton>

            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              title="Documentation and Help"
              display={{ base: "none", md: "inline-flex" }}
              gap={2}
            >
              <Icons.help size={16} />
              <Text>Help</Text>
            </Button>

            {/* Connection Actions */}
            {connected && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                colorPalette="red"
                size="sm"
                display={{ base: "none", lg: "inline-flex" }}
                gap={2}
              >
                <Icons.close size={14} />
                <Text>Disconnect</Text>
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
