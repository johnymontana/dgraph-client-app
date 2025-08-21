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
import { Icons } from '@/components/ui/icons';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: 'connection' | 'schema' | 'guides' | 'query' | 'text-to-dql' | 'geospatial';
  onSectionChange: (section: 'connection' | 'schema' | 'guides' | 'query' | 'text-to-dql' | 'geospatial') => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string;
  children?: React.ReactNode;
  isOpen: boolean;
}

function SidebarItem({
  icon: IconComponent,
  label,
  isActive,
  onClick,
  badge,
  children,
  isOpen
}: SidebarItemProps) {
  return (
    <Button
      layerStyle={isActive ? "nav-item.active" : "nav-item"}
      onClick={onClick}
      position="relative"
      h="auto"
      minH={{ base: "48px", md: "44px" }}
    >
      <HStack gap={3} align="center" w="full" justify="flex-start">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <IconComponent size={isOpen ? 18 : 20} />
        </Box>
        
        {isOpen && (
          <Text
            fontSize="sm"
            fontWeight="medium"
            flex={1}
            textAlign="left"
          >
            {label}
          </Text>
        )}
        
        {badge && !isOpen && (
          <Badge
            variant="solid"
            colorPalette="blue"
            size="xs"
            borderRadius="full"
            position="absolute"
            top={1}
            right={1}
            fontSize="2xs"
            w={4}
            h={4}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {badge}
          </Badge>
        )}
      </HStack>
      
      {children}
    </Button>
  );
}

export default function Sidebar({ isOpen, activeSection, onSectionChange, isMobile }: SidebarProps) {
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
  const sidebarWidth = isMobile ? "100vw" : isOpen ? "280px" : "72px";
  const transformValue = isOpen ? "translateX(0)" : isMobile ? "translateX(-100%)" : "translateX(0)";

  // Navigation items configuration
  const navItems = [
    { icon: Icons.database, label: "Connection", key: "connection" as const },
    { icon: Icons.schema, label: "Schema", key: "schema" as const },
    { icon: Icons.guides, label: "Guides", key: "guides" as const },
    { icon: Icons.query, label: "Query", key: "query" as const },
    { icon: Icons.ai, label: "Text to DQL", key: "text-to-dql" as const },
    { icon: Icons.map, label: "Geospatial", key: "geospatial" as const },
  ];

  // Don't render connection status until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Box
        position="fixed"
        left={0}
        top="60px"
        h="calc(100vh - 60px)"
        w={sidebarWidth}
        layerStyle="sidebar"
        transform={transformValue}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={40}
        overflow="hidden"
      >
        {/* Header */}
        <Box px={4} py={4}>
          {isOpen && (
            <Text textStyle="heading.card">
              Navigation
            </Text>
          )}
        </Box>

        {/* Placeholder for connection status */}
        <Box px={4} pb={4}>
          <Box
            layerStyle="status-badge"
            bg="status.loading"
            color="white"
            justifyContent={isOpen ? "flex-start" : "center"}
          >
            <Icons.loading size={12} />
            {isOpen && <Text ml={2}>Loading...</Text>}
          </Box>
        </Box>

        <Separator mx={4} />

        {/* Navigation Items */}
        <Box px={4} py={4} flex={1} overflowY="auto">
          <VStack gap={1} align="stretch">
            {navItems.map((item) => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                isActive={activeSection === item.key}
                onClick={() => onSectionChange(item.key)}
                badge={isOpen ? undefined : item.label.charAt(0)}
                isOpen={isOpen}
              />
            ))}
          </VStack>
        </Box>

        {/* Footer */}
        <Box px={4} py={4} borderTop="1px" borderColor="border.primary">
          <Text textStyle="body.small" textAlign={isOpen ? "left" : "center"}>
            {isOpen ? "DGraph Client v0.1.0" : "v0.1"}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      left={0}
      top="60px"
      h="calc(100vh - 60px)"
      w={sidebarWidth}
      layerStyle="sidebar"
      transform={transformValue}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={40}
      overflow="hidden"
    >
      {/* Header */}
      <Box px={4} py={4}>
        {isOpen && (
          <Text textStyle="heading.card">
            Navigation
          </Text>
        )}
      </Box>

      {/* Connection Status */}
      <Box px={4} pb={4}>
        <Box
          layerStyle="status-badge"
          bg={`status.${connectionStatus.status}`}
          color="white"
          justifyContent={isOpen ? "flex-start" : "center"}
        >
          {connectionStatus.status === 'connected' && <Icons.success size={12} />}
          {connectionStatus.status === 'disconnected' && <Icons.error size={12} />}
          {connectionStatus.status === 'loading' && <Icons.loading size={12} />}
          {isOpen && <Text ml={2}>{connectionStatus.label}</Text>}
        </Box>
      </Box>

      <Separator mx={4} />

      {/* Navigation Items */}
      <Box px={4} py={4} flex={1} overflowY="auto">
        <VStack gap={1} align="stretch">
          {navItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.key}
              onClick={() => onSectionChange(item.key)}
              badge={isOpen ? undefined : item.label.charAt(0)}
              isOpen={isOpen}
            />
          ))}
        </VStack>
      </Box>

      {/* Footer */}
      <Box px={4} py={4} borderTop="1px" borderColor="border.primary">
        <Text textStyle="body.small" textAlign={isOpen ? "left" : "center"}>
          {isOpen ? "DGraph Client v0.1.0" : "v0.1"}
        </Text>
      </Box>
    </Box>
  );
}
