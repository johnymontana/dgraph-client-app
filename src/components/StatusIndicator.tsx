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
  const { connected, endpoint, error, isHealthy, lastHealthCheck, performHealthCheck } = useDgraph();
  const [mounted, setMounted] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHealthCheck = async () => {
    if (!connected) return;

    setIsCheckingHealth(true);
    try {
      await performHealthCheck();
    } finally {
      setIsCheckingHealth(false);
    }
  };

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
      // Check if we have health information
      if (lastHealthCheck) {
        if (isHealthy) {
          return {
            status: 'connected',
            label: 'Connected',
            icon: Icons.success,
            bg: 'status.success',
            description: `Connected to ${endpoint} - Last health check: ${lastHealthCheck.toLocaleTimeString()}`
          };
        } else {
          return {
            status: 'warning',
            label: 'Unhealthy',
            icon: Icons.warning,
            bg: 'status.warning',
            description: `Connected to ${endpoint} but health check failed at ${lastHealthCheck.toLocaleTimeString()}`
          };
        }
      } else {
        return {
          status: 'connected',
          label: 'Connected',
          icon: Icons.success,
          bg: 'status.success',
          description: `Connected to ${endpoint} - Health check pending`
        };
      }
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
    <HStack gap={2} align="center">
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

      {connected && (
        <Box
          as="button"
          onClick={isCheckingHealth ? undefined : handleHealthCheck}
          bg="bg.muted"
          color="fg.primary"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          cursor={isCheckingHealth ? 'not-allowed' : 'pointer'}
          opacity={isCheckingHealth ? 0.6 : 1}
          title="Check database health"
          _hover={!isCheckingHealth ? { bg: 'bg.secondary' } : {}}
          _disabled={{
            cursor: 'not-allowed',
            opacity: 0.6
          }}
        >
          {isCheckingHealth ? 'Checking...' : 'Health Check'}
        </Box>
      )}
    </HStack>
  );
}
