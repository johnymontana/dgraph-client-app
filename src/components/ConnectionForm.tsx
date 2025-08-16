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
  Badge,
} from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';

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

  const { isLight } = useColorMode();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Connect button clicked, endpoint:', endpoint);
    setIsLoading(true);
    try {
      await connect();
      console.log('Connect successful');
    } catch (err) {
      console.error('Connect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnect button clicked');
    disconnect();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 50);
  };

  const handleQuickConnect = () => {
    console.log('Quick connect button clicked');
    // Pre-fill with the provided connection string
    setEndpoint('dgraph://patient-graph-willsworkspace.hypermode.host:443?sslmode=verify-ca&bearertoken=xffX^mUHZcw~9B');
    console.log('Endpoint set to:', 'dgraph://patient-graph-willsworkspace.hypermodespace.host:443?sslmode=verify-ca&bearertoken=xffX^mUHZcw~9B');
  };

  return (
    <Card.Root variant="elevated" p={{ base: 4, md: 6 }}>
      <VStack gap={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <Box>
          <VStack align={{ base: "stretch", md: "flex-start" }} gap={2} mb={2}>
            <HStack justify="space-between" align="center" w="full">
              <Heading as="h3" size={{ base: "md", md: "lg" }} color="fg.primary">
                Database Connection
              </Heading>
              {connected && (
                <Badge
                  variant="solid"
                  colorPalette="green"
                  size="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  Connected
                </Badge>
              )}
            </HStack>
            <Text color="fg.secondary" fontSize={{ base: "sm", md: "md" }}>
              Configure your DGraph database connection settings
            </Text>
          </VStack>
        </Box>

        {/* Quick Connect Button */}
        <Box>
          <Button
            variant="outline"
            colorPalette="blue"
            size={{ base: "md", md: "sm" }}
            onClick={handleQuickConnect}
            disabled={connected}
            w="full"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Quick Connect (Patient Graph)
          </Button>
        </Box>

        {error && (
          <Alert.Root status="error" variant="subtle">
            <Alert.Indicator />
            <Alert.Content>
              <Text fontSize="sm">{error}</Text>
            </Alert.Content>
          </Alert.Root>
        )}

        <Box as="form" onSubmit={handleConnect}>
          <VStack gap={4} align="stretch">
            <Field.Root required>
              <Field.Label color="fg.primary" fontSize="sm" fontWeight="medium">
                DGraph Endpoint
              </Field.Label>
              <Input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                disabled={connected}
                placeholder="dgraph://host:port?sslmode=verify-ca&bearertoken=xxx"
                size="md"
                variant="outline"
                _focus={{ ring: 2, ringColor: 'accent.primary', borderColor: 'accent.primary' }}
              />
              <Field.HelperText fontSize="xs" color="fg.tertiary">
                Supports: dgraph://host:port?sslmode=verify-ca&bearertoken=xxx, https://host:port, or http://localhost:8080
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label color="fg.primary" fontSize="sm" fontWeight="medium">
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
                _focus={{ ring: 2, ringColor: 'accent.primary', borderColor: 'accent.primary' }}
              />
              <Field.HelperText fontSize="xs" color="fg.tertiary">
                Optional if using bearer token in connection string
              </Field.HelperText>
            </Field.Root>

            {/* Hypermode Settings Section */}
            <Box border="1px" borderColor="border.primary" borderRadius="md">
              <Button
                type="button"
                onClick={() => setIsHypermodeExpanded(!isHypermodeExpanded)}
                w="full"
                variant="ghost"
                justifyContent="space-between"
                px={4}
                py={2}
                bg="bg.tertiary"
                _hover={{ bg: isLight ? 'gray.100' : 'gray.600' }}
                _focus={{ outline: 'none' }}
              >
                <HStack gap={2}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <Text fontWeight="medium" color="fg.primary">
                    AI-Powered Features
                  </Text>
                </HStack>
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  fill="currentColor"
                  style={{
                    transform: isHypermodeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </Button>

              <Collapsible.Root open={isHypermodeExpanded}>
                <Collapsible.Content>
                  <Box p={4} borderTop="1px" borderColor="border.primary">
                    <Field.Root>
                      <Field.Label color="fg.primary" fontSize="sm" fontWeight="medium">
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
                        _focus={{ ring: 2, ringColor: 'accent.primary', borderColor: 'accent.primary' }}
                      />
                      <Field.HelperText fontSize="xs" color="fg.tertiary">
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
                colorPalette="blue"
                size="md"
                disabled={isLoading}
                h="44px"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Connect to Database
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleDisconnect}
                w="full"
                colorPalette="red"
                size="md"
                h="44px"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </Button>
            )}
          </VStack>
        </Box>
      </VStack>
    </Card.Root>
  );
}
