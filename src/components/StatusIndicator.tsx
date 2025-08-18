'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';
import { Icons } from '@/components/ui/icons';

export default function StatusIndicator() {
  const { connected, endpoint, error } = useDgraph();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        layerStyle="status-badge"
        bg="status.loading"
        color="white"
        px={3}
        py={1.5}
      >
        <HStack gap={2} align="center">
          <Icons.loading size={12} />
          <Text fontSize="xs" fontWeight="semibold">
            Loading...
          </Text>
        </HStack>
      </Box>
    );
  }

  const getStatusInfo = () => {
    if (error) {
      return {
        status: 'error',
        label: 'Connection Error',
        icon: Icons.error,
        bg: 'status.error',
        description: error
      };
    }
    
    if (connected) {
      return {
        status: 'connected',
        label: 'Connected',
        icon: Icons.success,
        bg: 'status.success',
        description: `Connected to ${endpoint}`
      };
    }
    
    if (endpoint) {
      return {
        status: 'disconnected',
        label: 'Configured',
        icon: Icons.warning,
        bg: 'status.warning',
        description: `Endpoint configured: ${endpoint}`
      };
    }
    
    return {
      status: 'none',
      label: 'Not Configured',
      icon: Icons.database,
      bg: 'fg.muted',
      description: 'No endpoint configured'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <Box
      layerStyle="status-badge"
      bg={statusInfo.bg}
      color="white"
      px={3}
      py={1.5}
      title={statusInfo.description}
      cursor="help"
    >
      <HStack gap={2} align="center">
        <IconComponent size={12} />
        <Text fontSize="xs" fontWeight="semibold">
          {statusInfo.label}
        </Text>
      </HStack>
    </Box>
  );
}
