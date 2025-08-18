'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  Heading,
  Button,
  Textarea,
  Alert,
  Badge,
} from '@chakra-ui/react';
import { useDgraph } from '@/context/DgraphContext';
import { Icons } from '@/components/ui/icons';
import { McpService, McpConfig } from '@/services/mcpService';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export default function TextToDqlTab() {
  const { connected, mcpConfig, mcpServerUrl, mcpBearerToken, dgraphService, schemaText, embeddingProvider, embeddingApiKey, apiKey } = useDgraph();
  const [textInput, setTextInput] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mcpService, setMcpService] = useState<McpService | null>(null);
  const [mcpConnected, setMcpConnected] = useState(false);

  // Initialize MCP service when config is available
  useEffect(() => {
    const initMcp = async () => {
      // Use the new separate fields if available, otherwise fall back to JSON config
      if ((mcpServerUrl && mcpBearerToken) || mcpConfig) {
        try {
          let config: McpConfig;
          
          if (mcpServerUrl && mcpBearerToken) {
            // Use new separate fields
            config = {
              serverUrl: mcpServerUrl,
              bearerToken: mcpBearerToken,
              endpoint: '', // Legacy field, may be used by some implementations
              apiKey: '' // Legacy field, may be used by some implementations
            };
          } else {
            // Fall back to JSON config and merge with new fields
            const jsonConfig = JSON.parse(mcpConfig);
            config = {
              ...jsonConfig,
              serverUrl: mcpServerUrl || jsonConfig.serverUrl,
              bearerToken: mcpBearerToken || jsonConfig.bearerToken || jsonConfig.apiKey
            };
          }

          const service = new McpService(config);
          await service.connect();
          setMcpService(service);
          setMcpConnected(true);
          setError(null);
        } catch (err) {
          console.error('Failed to initialize MCP service:', err);
          setError('Failed to connect to MCP server. Check your configuration.');
          setMcpConnected(false);
        }
      } else {
        // Clear MCP service if no config is available
        if (mcpService) {
          mcpService.disconnect();
          setMcpService(null);
          setMcpConnected(false);
        }
      }
    };

    initMcp();

    return () => {
      if (mcpService) {
        mcpService.disconnect();
      }
    };
  }, [mcpConfig, mcpServerUrl, mcpBearerToken]);

  const handleGenerateQuery = async () => {
    if (!textInput.trim()) {
      setError('Please enter a text description');
      return;
    }

    if (!connected) {
      setError('Please connect to a Dgraph database first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let query = '';

      if (mcpConnected && mcpService) {
        // Use MCP server to generate query
        try {
          const result = await mcpService.callTool('generate_dql_query', {
            description: textInput,
            schema: schemaText
          });
          query = result.content?.[0]?.text || '';
        } catch (mcpError) {
          console.warn('MCP generation failed, falling back to direct AI:', mcpError);
          // Fall back to direct AI generation
          query = await generateWithDirectAI();
        }
      } else {
        // Use direct AI generation
        query = await generateWithDirectAI();
      }

      setGeneratedQuery(query);
    } catch (err) {
      console.error('Query generation failed:', err);
      setError('Failed to generate DQL query. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithDirectAI = async (): Promise<string> => {
    // Check if user has configured an API key in the connection form
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please enter your OpenAI API key in the connection form.');
    }

    // Use the OpenAI API key from the main connection form
    const model = openai('gpt-4o-mini', { apiKey: apiKey });
    
    const result = await generateText({
      model,
      prompt: `Generate a DQL (Dgraph Query Language) query based on this description: "${textInput}"

Schema information:
${schemaText}

The query should be syntactically correct DQL and follow Dgraph conventions. Include necessary predicates like uid and dgraph.type. Return only the DQL query, nothing else.`
    });

    return result.text;
  };

  const handleExecuteQuery = async () => {
    if (!generatedQuery.trim() || !dgraphService) {
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await dgraphService.query(generatedQuery);
      setQueryResult(result);
    } catch (err) {
      console.error('Query execution failed:', err);
      setError('Failed to execute query. Please check the generated DQL.');
    } finally {
      setIsExecuting(false);
    }
  };

  const renderMcpStatus = () => {
    if (!mcpServerUrl || !mcpBearerToken) {
      return (
        <Alert.Root status="warning" variant="subtle" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Text textStyle="body.medium">
              MCP server not configured. Go to Connection tab to configure MCP for enhanced query generation.
            </Text>
          </Alert.Content>
        </Alert.Root>
      );
    }

    return (
      <Box>
        <Badge
          variant="solid"
          colorPalette={mcpConnected ? "green" : "red"}
          size="sm"
          borderRadius="full"
          px={3}
          py={1}
          gap={2}
        >
          {mcpConnected ? <Icons.success size={12} /> : <Icons.error size={12} />}
          <Text>MCP {mcpConnected ? 'Connected' : 'Disconnected'}</Text>
        </Badge>
      </Box>
    );
  };

  if (!connected) {
    return (
      <VStack gap={6} align="stretch">
        <Box>
          <Heading textStyle="heading.section" mb={3}>
            Text to DQL
          </Heading>
          <Text textStyle="body.medium">
            Generate DQL queries from natural language descriptions using AI
          </Text>
        </Box>

        <Card.Root variant="elevated">
          <VStack gap={4} align="center" py={12}>
            <Box
              p={4}
              borderRadius="full"
              bg="bg.muted"
              color="fg.tertiary"
            >
              <Icons.database size={32} />
            </Box>
            <VStack gap={2} align="center">
              <Text textStyle="body.medium" textAlign="center">
                Database Connection Required
              </Text>
              <Text textStyle="body.small" textAlign="center" maxW="md">
                Connect to a database first to use Text to DQL functionality
              </Text>
            </VStack>
          </VStack>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Box>
          <Heading textStyle="heading.section" mb={3}>
            Text to DQL
          </Heading>
          <Text textStyle="body.medium">
            Generate DQL queries from natural language descriptions using AI
          </Text>
        </Box>
        {renderMcpStatus()}
      </HStack>

      {error && (
        <Alert.Root status="error" variant="subtle" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Text textStyle="body.medium">{error}</Text>
          </Alert.Content>
        </Alert.Root>
      )}

      <Card.Root variant="elevated" p={6}>
        <VStack gap={4} align="stretch">
          <Box>
            <Text textStyle="label" mb={2}>
              Describe what you want to query
            </Text>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., Find all patients with diabetes who visited in the last month"
              rows={3}
              resize="vertical"
              borderRadius="lg"
              _focus={{ 
                borderColor: 'accent.primary',
                shadow: 'shadow.focus',
                ring: 'none'
              }}
            />
          </Box>

          <Button
            onClick={handleGenerateQuery}
            loading={isGenerating}
            loadingText="Generating query..."
            disabled={!textInput.trim() || isGenerating}
            colorPalette="blue"
            size="lg"
            gap={2}
            borderRadius="lg"
          >
            <Icons.ai size={18} />
            <Text>Generate DQL Query</Text>
          </Button>
        </VStack>
      </Card.Root>

      {generatedQuery && (
        <Card.Root variant="elevated" p={6}>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Text textStyle="label">
                Generated DQL Query
              </Text>
              <Button
                onClick={handleExecuteQuery}
                loading={isExecuting}
                loadingText="Executing..."
                disabled={isExecuting}
                variant="outline"
                size="sm"
                gap={2}
                borderRadius="lg"
              >
                <Icons.play size={16} />
                <Text>Execute Query</Text>
              </Button>
            </HStack>

            <Box
              as="pre"
              bg="bg.muted"
              p={4}
              borderRadius="lg"
              overflow="auto"
              fontSize="sm"
              fontFamily="mono"
              border="1px"
              borderColor="border.primary"
            >
              {generatedQuery}
            </Box>
          </VStack>
        </Card.Root>
      )}

      {queryResult && (
        <Card.Root variant="elevated" p={6}>
          <VStack gap={4} align="stretch">
            <Text textStyle="label">
              Query Results
            </Text>
            <Box
              as="pre"
              bg="bg.muted"
              p={4}
              borderRadius="lg"
              overflow="auto"
              fontSize="sm"
              fontFamily="mono"
              border="1px"
              borderColor="border.primary"
              maxH="400px"
            >
              {JSON.stringify(queryResult, null, 2)}
            </Box>
          </VStack>
        </Card.Root>
      )}
    </VStack>
  );
}