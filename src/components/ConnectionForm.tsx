'use client';

import React, { useState } from 'react';
import { useDgraph } from '@/context/DgraphContext';
import {
  Box,
  Card,
  Heading,
  Field,
  Input,
  Button,
  Text,
  Alert,
  Collapsible,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

export default function ConnectionForm() {
  const {
    endpoint,
    apiKey,
    hypermodeRouterKey,
    setEndpoint,
    setApiKey,
    setHypermodeRouterKey,
    connect,
    disconnect,
    connected,
    error
  } = useDgraph();
  const [isLoading, setIsLoading] = useState(false);
  const [isHypermodeExpanded, setIsHypermodeExpanded] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await connect();
    setIsLoading(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 50);
  };

  return (
    <Card.Root bg={bgColor} shadow="md" p={6} mb={6}>
      <Heading as="h2" size="md" mb={4} color={textColor}>
        Dgraph Connection
      </Heading>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            {error}
          </Alert.Content>
        </Alert.Root>
      )}

      <Box as="form" onSubmit={handleConnect}>
        <VStack gap={4} align="stretch">
          <Field.Root required>
            <Field.Label color={textColor} fontSize="sm" fontWeight="medium">
              Dgraph Endpoint
            </Field.Label>
            <Input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              disabled={connected}
              placeholder="dgraph://host:port?sslmode=verify-ca&bearertoken=xxx"
              size="md"
              variant="outline"
              _focus={{ ring: 2, ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
            <Field.HelperText fontSize="xs" color={mutedTextColor}>
              Supports: dgraph://host:port?sslmode=verify-ca&bearertoken=xxx, https://host:port, or http://localhost:8080
            </Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label color={textColor} fontSize="sm" fontWeight="medium">
              API Key (optional)
            </Field.Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={connected}
              placeholder="Enter API key if required"
              size="md"
              variant="outline"
              _focus={{ ring: 2, ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
            <Field.HelperText fontSize="xs" color={mutedTextColor}>
              Optional if using bearer token in connection string
            </Field.HelperText>
          </Field.Root>

          {/* Hypermode Settings Section */}
          <Box border="1px" borderColor={borderColor} borderRadius="md">
            <Button
              type="button"
              onClick={() => setIsHypermodeExpanded(!isHypermodeExpanded)}
              w="full"
              variant="ghost"
              justifyContent="space-between"
              px={4}
              py={2}
              bg={hoverBgColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              _focus={{ outline: 'none' }}
            >
              <Text fontWeight="medium" color={textColor}>
                Hypermode Settings
              </Text>
              <Icon
                viewBox="0 0 20 20"
                color={mutedTextColor}
                transform={isHypermodeExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
                transition="transform 0.2s"
              >
                <path
                  fill="currentColor"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                />
              </Icon>
            </Button>

            <Collapsible.Root open={isHypermodeExpanded}>
              <Collapsible.Content>
                <Box p={4} borderTop="1px" borderColor={borderColor}>
                  <Field.Root>
                    <Field.Label color={textColor} fontSize="sm" fontWeight="medium">
                      Model Router Key
                    </Field.Label>
                    <Input
                      type="password"
                      value={hypermodeRouterKey}
                      onChange={(e) => setHypermodeRouterKey(e.target.value)}
                      disabled={connected}
                      placeholder="Enter Hypermode Model Router Key"
                      size="md"
                      variant="outline"
                      _focus={{ ring: 2, ringColor: 'brand.500', borderColor: 'brand.500' }}
                    />
                    <Field.HelperText fontSize="xs" color={mutedTextColor}>
                      Your Hypermode Model Router API key for AI-powered features
                    </Field.HelperText>
                  </Field.Root>
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>

          {!connected ? (
            <Button
              type="submit"
              loading={isLoading}
              loadingText="Connecting..."
              w="full"
              colorPalette="brand"
              size="md"
              disabled={isLoading}
            >
              Connect
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleDisconnect}
              w="full"
              colorPalette="red"
              size="md"
            >
              Disconnect
            </Button>
          )}
        </VStack>
      </Box>
    </Card.Root>
  );
}
