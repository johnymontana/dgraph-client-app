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
import { Icons } from '@/components/ui/icons';

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
          <HStack justify="space-between" align="start" w="full" mb={3}>
            <VStack align="start" gap={1} flex={1}>
              <Heading textStyle="heading.card">
                Database Connection
              </Heading>
              <Text textStyle="body.medium">
                Configure your DGraph database connection settings
              </Text>
            </VStack>
            {connected && (
              <Badge
                variant="solid"
                colorPalette="green"
                size="sm"
                borderRadius="full"
                px={3}
                py={1}
                gap={2}
                bg="status.success"
              >
                <Icons.success size={12} />
                <Text>Connected</Text>
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Quick Connect Button */}
        <Box>
          <Button
            variant="outline"
            size="md"
            onClick={handleQuickConnect}
            disabled={connected}
            w="full"
            gap={2}
            h="44px"
            borderRadius="lg"
            _hover={{
              bg: 'bg.hover',
              borderColor: 'accent.primary'
            }}
          >
            <Icons.zap size={16} />
            <Text>Quick Connect (Patient Graph)</Text>
          </Button>
        </Box>

        {error && (
          <Alert.Root status="error" variant="subtle" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Text textStyle="body.medium">{error}</Text>
            </Alert.Content>
          </Alert.Root>
        )}

        <Box as="form" onSubmit={handleConnect}>
          <VStack gap={4} align="stretch">
            <Field.Root required>
              <Field.Label textStyle="label">
                DGraph Endpoint
              </Field.Label>
              <Input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                disabled={connected}
                placeholder="dgraph://host:port?sslmode=verify-ca&bearertoken=xxx"
                size="lg"
                borderRadius="lg"
                _focus={{ 
                  borderColor: 'accent.primary',
                  shadow: 'shadow.focus',
                  ring: 'none'
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
              <Field.HelperText textStyle="helper">
                Supports: dgraph://host:port?sslmode=verify-ca&bearertoken=xxx, https://host:port, or http://localhost:8080
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label textStyle="label">
                API Key (optional)
              </Field.Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={connected}
                placeholder="Enter API key if required"
                size="lg"
                borderRadius="lg"
                _focus={{ 
                  borderColor: 'accent.primary',
                  shadow: 'shadow.focus',
                  ring: 'none'
                }}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
              <Field.HelperText textStyle="helper">
                Optional if using bearer token in connection string
              </Field.HelperText>
            </Field.Root>

            {/* Hypermode Settings Section */}
            <Box border="1px" borderColor="border.primary" borderRadius="lg" overflow="hidden">
              <Button
                type="button"
                onClick={() => setIsHypermodeExpanded(!isHypermodeExpanded)}
                w="full"
                variant="ghost"
                justifyContent="space-between"
                px={4}
                py={3}
                bg="bg.muted"
                borderRadius="0"
                _hover={{ bg: 'bg.hover' }}
                _focus={{ 
                  outline: '2px solid',
                  outlineColor: 'accent.primary',
                  outlineOffset: '-2px'
                }}
              >
                <HStack gap={3}>
                  <Icons.ai size={16} />
                  <Text textStyle="label">
                    AI-Powered Features
                  </Text>
                </HStack>
                <Box
                  transform={isHypermodeExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
                  transition="transform 0.2s ease-in-out"
                >
                  <Icons.chevronDown size={16} />
                </Box>
              </Button>

              <Collapsible.Root open={isHypermodeExpanded}>
                <Collapsible.Content>
                  <Box p={4} borderTop="1px" borderColor="border.primary" bg="bg.secondary">
                    <Field.Root>
                      <Field.Label textStyle="label">
                        Model Router Key
                      </Field.Label>
                      <Input
                        type="password"
                        value={hypermodeRouterKey}
                        onChange={(e) => setHypermodeRouterKey(e.target.value)}
                        disabled={connected}
                        placeholder="Enter Hypermode Model Router Key"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ 
                          borderColor: 'accent.primary',
                          shadow: 'shadow.focus',
                          ring: 'none'
                        }}
                        _disabled={{
                          opacity: 0.6,
                          cursor: 'not-allowed'
                        }}
                      />
                      <Field.HelperText textStyle="helper">
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
                size="lg"
                disabled={isLoading}
                h="48px"
                gap={2}
                borderRadius="lg"
              >
                <Icons.database size={18} />
                <Text>Connect to Database</Text>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleDisconnect}
                w="full"
                variant="outline"
                colorPalette="red"
                size="lg"
                h="48px"
                gap={2}
                borderRadius="lg"
              >
                <Icons.close size={16} />
                <Text>Disconnect</Text>
              </Button>
            )}
          </VStack>
        </Box>
      </VStack>
    </Card.Root>
  );
}
