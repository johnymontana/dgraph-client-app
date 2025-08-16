'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';

export default function StatusIndicator() {
  const { connected, endpoint, error } = useDgraph();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box>
        <HStack gap={2} align="center">
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg="gray.400"
          />
          <Text fontSize="sm" color="fg.secondary" fontWeight="medium">
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
        color: 'red',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
        description: error
      };
    }
    
    if (connected) {
      return {
        status: 'connected',
        label: 'Connected',
        color: 'green',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        description: `Connected to ${endpoint}`
      };
    }
    
    if (endpoint) {
      return {
        status: 'disconnected',
        label: 'Disconnected',
        color: 'orange',
        icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        description: `Endpoint configured: ${endpoint}`
      };
    }
    
    return {
      status: 'none',
      label: 'Not Configured',
      color: 'gray',
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      description: 'No endpoint configured'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Box title={statusInfo.description}>
      <HStack gap={2} align="center">
        <Box
          w={2}
          h={2}
          borderRadius="full"
          bg={`${statusInfo.color}.500`}
          animation={statusInfo.status === 'connected' ? 'pulse 2s infinite' : 'none'}
        />
        <Text fontSize="sm" color="fg.secondary" fontWeight="medium">
          {statusInfo.label}
        </Text>
        <svg viewBox="0 0 24 24" width="12" height="12" fill={`${statusInfo.color}.500`}>
          <path d={statusInfo.icon} />
        </svg>
      </HStack>
    </Box>
  );
}
